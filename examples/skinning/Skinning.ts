import { Camera, Renderer, Transform, Orbit, Skin, Animation, Mesh, Geometry, GLTFLoader, RenderPipeline, Texture, loadJSON, Plane } from 'ogpu';
import type { GPU } from '@/types';

import skinnedmesh from './skinnedmesh.wgsl?raw';
import shadowShader from './shadow.wgsl?raw';

const USE_JSON = true;

export class Skinning {
    renderer!: Renderer;
    gpu!: GPU;
    camera!: Camera;
    orbit!: Orbit;
    scene!: Transform;
    skin!: Skin;
    animLabel!: string;
    mesh!: Mesh;
    floor!: Mesh;
    credit!: HTMLDivElement;

    constructor(canvas: HTMLElement | null) {
        this.init(canvas);
    }

    async init(canvas: HTMLElement | null) {
        this.renderer = new Renderer({ canvas: canvas as HTMLCanvasElement | null, dpr: 2 });
        await this.renderer.ready;

        this.gpu = this.renderer.gpu;

        this.scene = new Transform();
        this.camera = new Camera({
            aspect: (this.gpu.canvas as HTMLCanvasElement).width / (this.gpu.canvas as HTMLCanvasElement).height,
            far: 300,
            fov: 35,
        });

        this.camera.position.set(6, 2, 6);
        this.orbit = new Orbit(this.camera, { element: this.gpu.canvas as HTMLCanvasElement, target: [0, 0, 0] });

        this.addCredit('Skinning. Model by <a href="https://artella.lpages.co/artella-lily-snout-giveaway/" target="_blank">Carlos Quintero and Zach Baharov</a>.');

        addEventListener('resize', this.handleResize);
        setTimeout(this.handleResize, 350);

        let skinData: any;
        let geometry: Geometry;

        if (USE_JSON) {
            skinData = await loadJSON('./assets/skinning/snout-rig.json');
            const animData = await loadJSON('./assets/skinning/snout-anim.json');

            this.skin = new Skin(this.gpu, { label: 'snout', data: skinData });

            this.animLabel = 'snout-anim';
            const animation = new Animation({
                label: this.animLabel,
                data: animData,
                transforms: this.skin.bones,
            }).fps(1);

            geometry = new Geometry(this.gpu, {
                data: {
                    position: { data: skinData.position, numComponents: 3, type: Float32Array },
                    normal: { data: skinData.normal, numComponents: 3, type: Float32Array },
                    uv: { data: skinData.uv, numComponents: 2, type: Float32Array },
                },
            });

            this.skin.addAnimation(animation);
        } else {
            const loader = new GLTFLoader(this.gpu, { dataOnly: true });
            await loader.load('./assets/skinning/breakdance.glb');

            const skinData = (loader as any).getSkinData(0);
            this.skin = new Skin(this.gpu, { label: 'dancer', data: skinData });

            const animFps = 30;
            const animData = (loader as any).getAnimation({ animation: 1, skin: 0, fps: animFps });
            this.animLabel = animData.label;
            this.skin.addAnimation(
                new Animation({
                    label: this.animLabel,
                    data: animData,
                    transforms: this.skin.bones,
                }).fps(animFps)
            );

            geometry = new Geometry(this.gpu, {
                data: {
                    position: { data: skinData.position, numComponents: 3, type: Float32Array },
                    normal: { data: skinData.normal, numComponents: 3, type: Float32Array },
                    uv: { data: skinData.uv, numComponents: 2, type: Float32Array },
                    indices: { data: skinData.indices },
                },
            });
        }

        const sampler = this.gpu.device.createSampler();

        const colorTexture = new Texture(this.gpu, { src: './assets/skinning/snout.jpg' });
        await colorTexture.ready;
        const colorView = colorTexture.createView();

        const pipeline = new RenderPipeline(this.gpu, {
            label: 'skinned-mesh-pipeline',
            code: skinnedmesh,
            vertexBuffers: geometry!.bufferLayouts,
        });

        this.mesh = new Mesh(this.gpu, {
            label: 'dancer-mesh',
            pipeline,
            geometry: geometry!,
            bindGroups: (uniformBuffer) => [
                this.gpu.device.createBindGroup({
                    layout: pipeline.bindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: { buffer: uniformBuffer } },
                        { binding: 1, resource: { buffer: this.skin.skinnedPositionBuffer } },
                        { binding: 2, resource: { buffer: this.skin.skinnedNormalBuffer } },
                        { binding: 3, resource: sampler },
                        { binding: 4, resource: colorView },
                    ],
                }),
            ],
        });
        this.mesh.addChild(this.skin.root);
        this.scene.addChild(this.mesh);

        this.mesh.scale.set(0.01, 0.01, 0.01);
        this.mesh.position.y = -1; // ground the character

        // Baked occlusion floor (snout-shadow.jpg) — drawn transparent so it just
        // darkens the white background under the model. Plane is XZ, no rotation.
        const floorGeo = new Plane(this.gpu, { width: 7, depth: 7 });
        const shadowTexture = new Texture(this.gpu, { src: './assets/skinning/snout-shadow.jpg' });
        await shadowTexture.ready;
        const shadowView = shadowTexture.createView();

        const shadowPipeline = new RenderPipeline(this.gpu, {
            label: 'shadow-floor-pipeline',
            code: shadowShader,
            vertexBuffers: floorGeo.bufferLayouts,
            transparent: true,
        });

        this.floor = new Mesh(this.gpu, {
            label: 'shadow-floor',
            pipeline: shadowPipeline,
            geometry: floorGeo,
            bindGroups: (uniformBuffer) => [
                this.gpu.device.createBindGroup({
                    layout: shadowPipeline.bindGroupLayout(0),
                    entries: [
                        { binding: 0, resource: { buffer: uniformBuffer } },
                        { binding: 1, resource: sampler },
                        { binding: 2, resource: shadowView },
                    ],
                }),
            ],
        });
        this.floor.position.y = -1;
        this.scene.addChild(this.floor);

        this.gpu.renderer.add(this.update);
    }

    update = ({ deltaTime = 0 }: { deltaTime?: number } = {}) => {
        this.renderer.setClearColor({ r: 1, g: 1, b: 1 });

        const anim: any = this.skin.getAnimation(this.animLabel);
        anim.elapsed += deltaTime * anim.fps();
        this.skin.update();

        this.renderer.render({ scene: this.scene, camera: this.camera });
        this.orbit.update();
    };

    handleResize = () => {
        this.camera.aspect = this.renderer.canvas.width / this.renderer.canvas.height;
        this.camera.updateProjectionMatrix();
    };

    // Top-left credit overlay, matching OGL's .Info styling.
    addCredit(html: string) {
        const info = document.createElement('div');
        info.className = 'Info';
        info.innerHTML = html;
        document.body.appendChild(info);
        this.credit = info;
    }
}
