import { Renderer, RenderPipeline, Mesh, Transform, FullscreenTriangle } from 'ogpu';
import type { GPU } from '@/types';

import shader from './triangle.wgsl?raw';

// Port of OGL's triangle-screen-shader: a single fullscreen covering triangle
// (position -1..3, uv 0..2; excess clipped) with an animated cos() color ramp.
// No camera — the vertex stage writes clip-space positions directly.
export class Triangle {
    renderer!: Renderer;
    gpu!: GPU;
    scene!: Transform;
    mesh!: Mesh;

    constructor() {
        this.init();
    }

    async init() {
        const canvas = document.getElementById('web-gpu-canvas') as HTMLCanvasElement;
        this.renderer = new Renderer({ canvas, dpr: 2 });
        await this.renderer.ready;

        this.gpu = this.renderer.gpu;
        this.scene = new Transform();

        const geometry = new FullscreenTriangle(this.gpu);

        const pipeline = new RenderPipeline(this.gpu, {
            label: 'triangle-screen-pipeline',
            code: shader,
            vertexBuffers: geometry.bufferLayouts,
            cullMode: 'none',
        });

        this.mesh = new Mesh(this.gpu, {
            label: 'triangle-screen-mesh',
            pipeline,
            geometry,
            bindGroups: (uniformBuffer: GPUBuffer) => [
                this.gpu.device.createBindGroup({
                    layout: pipeline.bindGroupLayout(0),
                    entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
                }),
            ],
        });
        this.mesh.uniforms.set({ uColor: [0.3, 0.2, 0.5] });
        this.mesh.setParent(this.scene);

        this.gpu.renderer.add(this.update);
    }

    update = () => {
        this.renderer.render({ scene: this.scene });
    };
}
