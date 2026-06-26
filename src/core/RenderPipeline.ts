let ID = 1;

import { makeBindGroupLayoutDescriptors, makeShaderDataDefinitions } from 'webgpu-utils';
import { registerShader } from './ShaderReload';
import { applyOverrideConstants } from '@utils/wgslOverrides';
import type { GPU } from '@/types';

export interface RenderPipelineOptions {
    label?: string;
    code: string;
    geometry?: import('./Geometry.js').Geometry;
    vertexBuffers?: GPUVertexBufferLayout[];
    targets?: GPUColorTargetState[];
    depthTest?: boolean;
    depthWrite?: boolean;
    depthStencil?: GPUDepthStencilState | false | Record<string, never>;
    transparent?: boolean;
    cullMode?: GPUCullMode;
    topology?: GPUPrimitiveTopology;
    blending?: { color?: GPUBlendComponent; alpha?: GPUBlendComponent };
    sampleCount?: number;
    constants?: Record<string, number>;
}

export interface CreateBindGroupOptions {
    index?: number;
    entries: GPUBindGroupEntry[];
    label?: string;
}

// Wraps GPURenderPipeline: reflects raw WGSL (webgpu-utils) into bind-group layouts
// and a compiled GPURenderPipeline. Does NOT own uniform buffers or bind groups —
// those are per-mesh concerns managed by each Mesh instance.

export class RenderPipeline {
    label!: string;
    gpu!: GPU;
    id!: number;
    depthTest!: boolean;
    depthWrite!: boolean;
    depthStencil!: GPUDepthStencilState | false | Record<string, never>;
    transparent!: boolean;
    cullMode!: GPUCullMode;
    vertexBuffers!: GPUVertexBufferLayout[];
    code!: string;
    module!: GPUShaderModule;
    defs!: any;
    pipeline!: GPURenderPipeline;
    _buildOpts!: {
        targets: GPUColorTargetState[] | undefined;
        topology: GPUPrimitiveTopology;
        blending: { color?: GPUBlendComponent; alpha?: GPUBlendComponent };
        sampleCount: number;
        constants: Record<string, number>;
    };
    _bindGroupLayouts!: GPUBindGroupLayout[];
    _unregister!: () => void;

    constructor(
        gpu: GPU,
        {
            label = 'rendering',
            code = ``,
            vertexBuffers = [],
            targets,
            depthTest = true,
            depthWrite = true,
            depthStencil = {},
            transparent = false,
            cullMode = 'back',
            topology = 'triangle-list',
            blending = {},
            sampleCount = 1,
            constants = {},
        }: RenderPipelineOptions & { vertexBuffers?: GPUVertexBufferLayout[] } = {} as any
    ) {
        if (!gpu) {
            console.error('no webgpu context provided');
            return;
        }

        if (!code) {
            console.error('no shader code provided');
            return;
        }

        this.label = label;
        this.gpu = gpu;
        this.depthTest = depthTest;
        this.depthWrite = depthWrite;
        this.depthStencil = depthStencil;
        this.transparent = transparent;
        this.cullMode = cullMode as GPUCullMode;
        this.id = ID++;
        // vertex buffer layout(s) only — never the geometry instance. the layout
        // is baked into the pipeline at compile; the actual buffers are bound
        // per-draw by the Mesh that owns the geometry. typically sourced from a
        // geometry via `geo.bufferLayouts`, or a standalone descriptor.
        this.vertexBuffers = vertexBuffers;

        // stash everything build() needs so a hot-reload can rebuild the
        // GPU pipeline from fresh WGSL without re-running the example.
        this._buildOpts = { targets, topology: topology as GPUPrimitiveTopology, blending, sampleCount, constants };

        this.build(code);

        this._unregister = registerShader(this);
    }

    // (Re)compiles the shader module and (re)creates the GPURenderPipeline.
    // Called once from the constructor and again on each hot-reload.
    // Meshes detect a reload by comparing their cached `_defs` reference
    // against `pipeline.defs` — swapping `this.defs` here is the signal.
    build(code: string): void {
        this.code = code;

        const { targets, topology, blending, sampleCount, constants } = this._buildOpts;

        // Bake override constants into source (Safari has no pipeline-override
        // support) instead of passing them to the pipeline descriptor.
        const bakedCode = applyOverrideConstants(code, constants);

        this.module = this.gpu.device.createShaderModule({
            label: this.label,
            code: bakedCode,
        });

        this.defs = makeShaderDataDefinitions(bakedCode);

        const _targets: GPUColorTargetState[] = (targets?.length ?? 0) > 0 ? targets! : [{ format: this.gpu.presentationFormat }];
        let _blending: { color?: GPUBlendComponent; alpha?: GPUBlendComponent } = blending;

        if (this.transparent || _blending.color) {
            _blending = _blending.color
                ? _blending
                : {
                      color: {
                          srcFactor: 'src-alpha',
                          dstFactor: 'one-minus-src-alpha',
                      },
                      alpha: {
                          srcFactor: 'src-alpha',
                          dstFactor: 'one-minus-src-alpha',
                      },
                  };

            _targets.forEach((t) => {
                Object.assign(t, {
                    blend: _blending,
                });
            });
        }

        const pipelineDesc: any = {
            vertex: {
                entryPoint: 'vs',
                module: this.module,
                buffers: this.vertexBuffers,
            },
            multisample: {
                count: sampleCount,
            },
        };

        // Depth-only passes (e.g. shadow maps) ship a vertex-only module with
        // no `fs` entry point — omit the fragment stage so the pipeline has no
        // color targets. webgpu-utils keys entry points by name in `defs`.
        if (this.defs.entryPoints?.fs) {
            pipelineDesc.fragment = {
                entryPoint: 'fs',
                module: this.module,
                targets: _targets,
            };
        }

        const descriptors = makeBindGroupLayoutDescriptors(this.defs, pipelineDesc);
        // Keep the explicit BGLs around so callers can build bind groups against
        // them via bindGroupLayout(i) instead of reaching into the compiled
        // pipeline (pipeline.getBindGroupLayout). Explicit layouts from identical
        // descriptors are group-equivalent, so a bind group built against these
        // survives a hot-reload even though build() mints fresh objects.
        this._bindGroupLayouts = descriptors.map((d) => {
            return this.gpu.device.createBindGroupLayout(d);
        });

        const layout = this.gpu.device.createPipelineLayout({
            bindGroupLayouts: this._bindGroupLayouts,
        });

        // depthStencil resolves three ways:
        //   false           -> omit depth state (fullscreen/blit passes, VFX)
        //   {} (default)     -> engine default depth24plus state
        //   populated object -> dev-supplied state verbatim (e.g. shadow-map
        //                       passes needing depthBias / depth32float)
        const depthStencil =
            this.depthStencil && Object.keys(this.depthStencil).length
                ? this.depthStencil
                : this.depthStencil // {} is truthy -> use engine default; false -> null
                  ? {
                        depthWriteEnabled: this.depthWrite,
                        depthCompare: !this.depthTest ? 'always' : 'less',
                        format: 'depth24plus',
                    }
                  : null;

        this.pipeline = this.gpu.device.createRenderPipeline({
            label: this.label,
            layout,
            ...pipelineDesc,
            primitive: {
                cullMode: this.cullMode,
                topology,
            },
            ...(depthStencil ? { depthStencil } : {}),
        });
    }

    // Returns the explicit bind group layout for `groupIndex` so callers can
    // build their own bind groups. Mirrors ComputeShader.bindGroupLayout — both
    // pipeline classes are pure compiled state that serve layouts; the caller
    // owns the bind group.
    bindGroupLayout(groupIndex = 0): GPUBindGroupLayout {
        return this._bindGroupLayouts[groupIndex];
    }

    // Hot-reload entry point. Mesh.draw detects the reload by comparing its
    // cached `_defs` reference against `pipeline.defs` on each draw call.
    reload(code: string): void {
        try {
            this.build(code);
            console.log(`[hot] reloaded render pipeline '${this.label}'`);
        } catch (e) {
            console.error(`[hot] failed to reload render pipeline '${this.label}'`, e);
        }
    }

    destroy(): void {
        this._unregister?.();
    }
}
