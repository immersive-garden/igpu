import { Transform } from './Transform';
import { Mat3, Mat4, Vec2 } from '@math';
import { makeStructuredView } from 'webgpu-utils';
import { createUniformBuffer } from '@utils/BufferUtils';
import type { GPU, StructuredView } from '@/types';
import type { RenderPipeline } from './RenderPipeline.js';
import type { Geometry } from './Geometry.js';
import type { Camera } from './Camera.js';

const _res = /* @__PURE__ */ new Vec2();

export interface MeshOptions {
    label?: string;
    pipeline: RenderPipeline;
    geometry: Geometry;
    bindGroups: GPUBindGroup[] | ((uniformBuffer: GPUBuffer) => GPUBindGroup[]);
    manualRender?: boolean;
    renderOrder?: number;
    drawBuffer?: GPUBuffer | null;
    frustumCulled?: boolean;
}

export interface DrawArgs {
    camera?: Camera | null;
    pass: GPURenderPassEncoder;
    time?: number;
}

type RenderCallback = (args: { mesh: Mesh; camera: Camera | null }) => void;

// Renderable node: owns a uniform buffer + bind groups, binds a pipeline + geometry,
// and issues the draw call (writes the standard per-frame uniforms).
//
// `bindGroups` is REQUIRED — either a `GPUBindGroup[]` array or a factory
// `(uniformBuffer) => GPUBindGroup[]`. The factory form receives this mesh's own
// uniform buffer so group(0) can bind it at binding 0. This lets a single pipeline
// be shared across many meshes without their per-object uniforms stomping each other.
export class Mesh extends Transform {
    gpu!: GPU;
    manualRender!: boolean;
    renderOrder!: number;
    frustumCulled!: boolean;
    pipeline!: RenderPipeline;
    geometry!: Geometry;
    modelViewMatrix!: Mat4;
    normalMatrix!: Mat3;
    objectMatrix!: Mat4;
    uniforms!: StructuredView;
    uniformBuffer!: GPUBuffer;
    bindGroups!: GPUBindGroup[];
    _defs: any;
    beforeRenderCallbacks!: Set<RenderCallback>;
    afterRenderCallbacks!: Set<RenderCallback>;
    zDepth?: number;
    hit?: any;

    constructor(gpu: GPU, { label = 'basic mesh', pipeline, geometry, bindGroups, manualRender = false, renderOrder = 0, frustumCulled = true }: MeshOptions) {
        super();

        if (!gpu) {
            console.error('no webgpu context found');
            return;
        }

        this.label = label;
        this.gpu = gpu;
        this.visible = true;
        this.manualRender = manualRender;
        this.renderOrder = renderOrder;
        this.frustumCulled = frustumCulled;

        if (!geometry) {
            console.error('no geometry provided');
            return;
        }

        this.pipeline = pipeline;
        // Mesh owns the geometry. the pipeline only carries the vertex *layout*
        // (its `vertexBuffers`); many geometries sharing that layout can run
        // through one pipeline — they just bind different buffers per-draw.
        this.geometry = geometry;
        this.modelViewMatrix = new Mat4();
        this.normalMatrix = new Mat3();
        this.objectMatrix = new Mat4();

        // Each mesh owns its uniform buffer, built from the pipeline's reflected
        // uniforms struct. bind groups are supplied by the caller (array or factory).
        this.uniforms = makeStructuredView(pipeline.defs.uniforms.uniforms);
        this.uniformBuffer = createUniformBuffer(gpu, {
            label: `${label}-uniforms`,
            size: this.uniforms.arrayBuffer.byteLength,
        });
        this.bindGroups = typeof bindGroups === 'function' ? bindGroups(this.uniformBuffer) : bindGroups;
        this._defs = pipeline.defs;

        this.beforeRenderCallbacks = new Set();
        this.afterRenderCallbacks = new Set();
    }

    onBeforeRender(f: RenderCallback): this {
        this.beforeRenderCallbacks.add(f);
        return this;
    }

    onAfterRender(f: RenderCallback): this {
        this.afterRenderCallbacks.add(f);
        return this;
    }

    draw({ camera = null, pass, time = 0 }: DrawArgs): void {
        // Hot-reload guard: pipeline.defs is swapped on each reload. Rebuild the
        // structured view from the new defs, preserving values when the byte
        // length is unchanged, else recreate the buffer and warn.
        if (this._defs !== this.pipeline.defs) {
            const next = makeStructuredView(this.pipeline.defs.uniforms.uniforms);
            if (this.uniforms.arrayBuffer.byteLength === next.arrayBuffer.byteLength) {
                new Uint8Array(next.arrayBuffer).set(new Uint8Array(this.uniforms.arrayBuffer));
            } else {
                this.uniformBuffer.destroy();
                this.uniformBuffer = createUniformBuffer(this.gpu, {
                    label: `${this.label}-uniforms`,
                    size: next.arrayBuffer.byteLength,
                });
                console.warn(`[hot] ${this.label}: uniform layout changed — bind groups must be recreated`);
            }
            this.uniforms = next;
            this._defs = this.pipeline.defs;
        }

        // Shaders declare only the subset of standard uniforms they use, so a
        // given view may be undefined — optional-chain the writes so missing
        // ones are skipped (matches the old behaviour where wgpu-matrix
        // silently discarded writes to a missing target).
        const views = this.uniforms.views;

        if (camera) {
            views.projectionMatrix?.set(camera.projectionMatrix);
            views.cameraPosition?.set(camera.worldPosition);
            views.viewMatrix?.set(camera.viewMatrix);

            this.modelViewMatrix.copy(camera.viewMatrix).multiply(this.worldMatrix);
            views.modelViewMatrix?.set(this.modelViewMatrix);

            this.normalMatrix.fromNormalMatrix(this.worldMatrix);
            views.normalMatrix?.set(this.normalMatrix);
            views.cameraQuaternion?.set(camera.quaternion);
        }

        views.modelMatrix?.set(this.worldMatrix);
        this.objectMatrix.copy(this.worldMatrix).invert();
        views.objectMatrix?.set(this.objectMatrix);

        this.beforeRenderCallbacks.forEach((cb) => cb && cb({ mesh: this, camera }));

        this.uniforms.set({
            resolution: _res.set(this.gpu.canvas.width, this.gpu.canvas.height),
            time: time,
        });

        this.gpu.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniforms.arrayBuffer);

        // track bound pipeline on the pass (fresh per render pass) to skip redundant setPipeline
        const p = pass as GPURenderPassEncoder & { _currentPipeline?: GPURenderPipeline };
        if (p._currentPipeline !== this.pipeline.pipeline) {
            p.setPipeline(this.pipeline.pipeline);
            p._currentPipeline = this.pipeline.pipeline;
        }

        this.bindGroups.forEach((bindGroup, i) => {
            pass.setBindGroup(i, bindGroup);
        });

        let bindingOffset = 0;

        this.geometry.nonInstancedVerts.buffers.forEach((buffer: GPUBuffer, i: number) => {
            pass.setVertexBuffer(i, buffer);
            bindingOffset++;
        });

        if (this.geometry.hasInstancedAttributes) {
            this.geometry.instancedVerts.buffers.forEach((buffer: GPUBuffer, i: number) => {
                pass.setVertexBuffer(bindingOffset + i, buffer);
            });
        }

        const drawBuffer = this.geometry.drawBuffer;
        const instanceCount = this.geometry.hasInstancedAttributes ? this.geometry.instancedVerts.numElements : 1;

        if (this.geometry.nonInstancedVerts.indexBuffer) {
            pass.setIndexBuffer(this.geometry.nonInstancedVerts.indexBuffer, this.geometry.nonInstancedVerts.indexFormat);
            if (drawBuffer) {
                pass.drawIndexedIndirect(drawBuffer, 0);
            } else {
                pass.drawIndexed(this.geometry.nonInstancedVerts.numElements, instanceCount);
            }
        } else {
            if (drawBuffer) {
                pass.drawIndirect(drawBuffer, 0);
            } else {
                pass.draw(this.geometry.nonInstancedVerts.numElements, instanceCount);
            }
        }

        this.afterRenderCallbacks.forEach((cb) => cb && cb({ mesh: this, camera }));
    }
}
