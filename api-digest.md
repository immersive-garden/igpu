# API digest

Terse public-surface index of `src/` for navigation: read a file’s API without opening it. Exported classes (with public method signatures), functions, consts, and barrel re-exports. Private (`_`-prefixed) methods and accessors omitted. Auto-generated — regenerate with `node scripts/build-api-digest.mjs`. Pairs with AGENTS.md (rationale) and module-graph.json (import edges).

## src

### examples\Loader.ts
- **class Loader**
  - constructor(renderer: Renderer, { el = '#ogpu-loader' }: LoaderOptions = {})

### examples\computefrustumculling\ComputeFrustumCulling.ts
- **class ComputeFrustumCulling**
  - constructor()
  - init()
  - cameraPath(vec: Vec3, time: number, y: number)

### examples\cubemap\CubeMap.ts
- **class CubeMapExample**
  - constructor()
  - init()

### examples\frustumculling\FrustumCulling.ts
- **class FrustumCulling**
  - constructor()
  - init()
  - cameraPath(vec: Vec3, time: number, y: number)

### examples\gltf\GLTF.ts
- **class GLTF**
  - constructor(canvas: HTMLElement | null)
  - init(canvas: HTMLElement | null)
  - initIBL({ url = './assets/pbr/artistworkshop_oct.exr', shUrl = './assets/pbr/artistworkshop_sh.js…)

### examples\hellowebgpu\BoxMesh.ts
- **class BoxMesh** extends Transform
  - constructor(gpu: GPU)

### examples\hellowebgpu\HelloWebGPU.ts
- **class HelloWebGPU**
  - constructor()
  - init()

### examples\hellowebgpu\uniformStruct.ts
- fn `makeUniformStruct(gpu: GPU, def: any, values: Record<string, unknown>, label: string)`

### examples\instancing\Instancing.ts
- **class Instancing**
  - constructor()
  - init()

### examples\instancingpicking\InstancingPicking.ts
- **class InstancingPicking**
  - constructor()
  - init()

### examples\ktx\KTX.ts
- **class KTX**
  - constructor()
  - init()
  - addInfo(text: string)

### examples\msaa\MSAA.ts
- **class MSAA**
  - constructor()
  - init()
  - buildTarget(sampleCount: number)
  - initDisplay()
  - displayBindGroup()
  - bindDisplay()

### examples\orbitcontrols\OrbitControls.ts
- **class OrbitControls**
  - constructor()
  - init()
  - addCredit()

### examples\particles\Particles.ts
- **class Particles**
  - constructor()
  - init()

### examples\pbrshader\PBRShader.ts
- **class PBRShader**
  - constructor({ el = null }: { el?: HTMLElement | null } = {})
  - init(el: HTMLElement | null)
  - initTestScene()
  - loadTexture(url: string)
  - swizzleRMO(url: string)
  - addCarPart(jsonUrl: string, maps: CarMaps, { transparent = false } = {})
  - addShadowFloor()
  - initProbes(ibl: IBLResult)
  - initIBL({ url = './assets/pbr/artistworkshop_oct.exr', shUrl = './assets/pbr/artistworkshop_sh.js…)
  - solidTexture(rgba: number[], label: string)
  - initPane()

### examples\primitives\Primitives.ts
- **class Primitives**
  - constructor()
  - init()

### examples\raycasting\Raycasting.ts
- **class Raycasting**
  - constructor()
  - init()

### examples\rendertotexture\RenderToTexture.ts
- **class RenderToTexture**
  - constructor({ el = null }: { el?: HTMLElement | null } = {})
  - init(el: HTMLElement | null)
  - initDisplay()
  - initTestScene()

### examples\scenegraph\SceneGraph.ts
- **class SceneGraph**
  - constructor()
  - init()

### examples\shadowmapping\Shadowmapping.ts
- **class Shadowmapping**
  - constructor({ el = null }: { el?: HTMLElement | null } = {})
  - init(el: HTMLElement | null)

### examples\skinning\Skinning.ts
- **class Skinning**
  - constructor(canvas: HTMLElement | null)
  - init(canvas: HTMLElement | null)
  - addCredit(html: string)

### examples\sorttransparency\SortTransparency.ts
- **class SortTransparency**
  - constructor()
  - init()

### examples\textures\Textures.ts
- **class Textures**
  - constructor()
  - init()

### examples\triangle\Triangle.ts
- **class Triangle**
  - constructor()
  - init()

### src\core\Camera.ts
- **class Camera** extends Transform
  - constructor({ near = 0.1, far = 100, fov = 45, aspect = 1, left, right, bottom, top, zoom = 1 }: Came…)
  - perspective({ near = this.near, far = this.far, fov = this.fov, aspect = this.aspect }: CameraOptions…)
  - orthographic({ near = this.near, far = this.far, left = this.left ?? -1, right = this.right ?? 1, bott…)
  - updateMatrixWorld(force?: boolean)
  - updateProjectionMatrix()
  - lookAt(target: ArrayLike<number>)
  - project(v: Vec3)
  - unproject(v: Vec3)
  - updateFrustum()
  - frustumIntersectsMesh(node: any, worldMatrix: Mat4 = node.worldMatrix)
  - frustumIntersectsSphere(center: Vec3, radius: number)
  - getFrustumSize(z?: number)

### src\core\ComputeShader.ts
- **class ComputeShader**
  - constructor(gpu: GPU, { label = '', code = ``, layout = 'auto' as GPUPipelineLayout | 'auto', constan…)
  - build(code: string)
  - reload(code: string)
  - isValidKernel(key: string)
  - findKernel(key: string)
  - bindGroupLayout(kernelOrKey: GPUComputePipeline | string, groupIndex = 0)
  - dispatch(encoder: GPUCommandEncoder, { pass = null, kernel, bindGroup, bindGroupIndex = 0, dispatc…)

### src\core\Geometry.ts
- **class Geometry**
  - constructor(gpu: GPU, { data, instancedData, interleave = false, drawBuffer = null }: GeometryOptions…)
  - computeBoundingBox(attr: PositionAttr | null = this._positionAttr())
  - computeBoundingSphere(attr: PositionAttr | null = this._positionAttr())
  - destroy()

### src\core\Mesh.ts
- **class Mesh** extends Transform
  - constructor(gpu: GPU, { label = 'basic mesh', pipeline, geometry, bindGroups, manualRender = false, r…)
  - onBeforeRender(f: RenderCallback)
  - onAfterRender(f: RenderCallback)
  - draw({ camera = null, pass, time = 0 }: DrawArgs)

### src\core\RenderPipeline.ts
- **class RenderPipeline**
  - constructor(gpu: GPU, { label = 'rendering', code = ``, vertexBuffers = [], targets, depthTest = true…)
  - build(code: string)
  - bindGroupLayout(groupIndex = 0)
  - reload(code: string)
  - destroy()

### src\core\RenderTarget.ts
- **class RenderTarget**
  - constructor(gpu: GPU, { width = 1280, height = 720, depth = 1, format = 'bgra8unorm' as GPUTextureFor…)
  - createTextures()
  - createDepthTexture()
  - createView(i = 0)
  - getTargets()
  - destroy()
  - onResize({ width, height, depth }: { width?: number; height?: number; depth?: number } = {})

### src\core\Renderer.ts
- **class Renderer**
  - constructor({ canvas = null, dpr = null, transparent = false, depth = true, stencil = true }: Rendere…)
  - initDevice()
  - init(device: GPUDevice)
  - createDepthTexture()
  - addHandlers()
  - addResizeHandler(cb: (w: number, h: number) => void)
  - add(f: (args: UpdateArgs) => void)
  - remove(f: (args: UpdateArgs) => void)
  - addDeviceLostHandler(cb: (info: GPUDeviceLostInfo) => void)
  - addDeviceRestoredHandler(cb: (gpu: GPU) => void)
  - addBootProgressHandler(cb: (pct: number) => void)
  - addBootCompleteHandler(cb: () => void)
  - forceDeviceLoss()
  - setClearColor({ r = 0, g = 0, b = 0, a = this.transparent ? 0 : 1 }: Partial<ClearColor> = {})
  - trackCompile(promise: Promise<any>)
  - updateClock(time = 0)
  - sortOpaque(a: any, b: any)
  - sortTransparent(a: any, b: any)
  - sortUI(a: any, b: any)
  - getRenderQueue({ scene, camera, sort = true, frustumCull = true }: { scene: Transform; camera?: Camera; …)
  - render({ scene, camera, target = null, loadOp = 'clear', storeOp = 'store', depthLoadOp = 'clear…)

### src\core\ShaderReload.ts
- fn `registerShader(instance: ShaderInstance)`

### src\core\Texture.ts
- **class Texture**
  - constructor(gpu: GPU, { width = 2, height = 2, depth = 1, data = null, format = 'rgba8unorm' as GPUTe…)
  - update({ width = 2, height = 2, depth = 1, data, format = 'rgba8unorm' as GPUTextureFormat, dime…)
  - createView()
  - destroy()

### src\core\Transform.ts
- **class Transform**
  - constructor()
  - setParent(parent: Transform | null, notifyParent = true)
  - addChild(child: Transform, notifyChild = true)
  - removeChild(child: Transform, notifyChild = true)
  - updateMatrixWorld(force?: boolean)
  - updateMatrix()
  - traverse(callback: (node: Transform) => boolean | void)
  - lookAt(target: ArrayLike<number>, invert?: boolean)
  - decompose()
  - setRotation(quaternion: Quat)
  - rotateX(angle: number)
  - rotateY(angle: number)
  - rotateZ(angle: number)
  - getEuler(out: Euler = new Euler())

### src\core\index.ts
- re-export { Renderer } from './Renderer.js'
- re-export { Transform } from './Transform.js'
- re-export { Camera } from './Camera.js'
- re-export { Mesh } from './Mesh.js'
- re-export { Geometry } from './Geometry.js'
- re-export { Box, Sphere, Plane, Torus, Cylinder, Disc, Cone, Quad, ThreeDF, FullscreenTriangle } from './primitives/index.js'
- re-export { RenderPipeline } from './RenderPipeline.js'
- re-export { ComputeShader } from './ComputeShader.js'
- re-export { Texture } from './Texture.js'
- re-export { RenderTarget } from './RenderTarget.js'
- re-export { Skin } from './skin/Skin.js'

### src\core\primitives\Box.ts
- **class Box** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: BoxOptions = {})

### src\core\primitives\Cone.ts
- **class Cone** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: ConeOptions = {})

### src\core\primitives\Cylinder.ts
- **class Cylinder** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: CylinderOptions = {})

### src\core\primitives\Disc.ts
- **class Disc** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: DiscOptions = {})

### src\core\primitives\FullscreenTriangle.ts
- **class FullscreenTriangle** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave }: FullscreenTriangleOptions = {})

### src\core\primitives\Plane.ts
- **class Plane** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: PlaneOptions = {})

### src\core\primitives\Quad.ts
- **class Quad** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: QuadOptions = {})

### src\core\primitives\Sphere.ts
- **class Sphere** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: SphereOptions = {})

### src\core\primitives\ThreeDF.ts
- **class ThreeDF** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave }: ThreeDFOptions = {})

### src\core\primitives\Torus.ts
- **class Torus** extends Geometry
  - constructor(gpu: GPU, { instancedData, interleave, ...opts }: TorusOptions = {})

### src\core\primitives\index.ts
- re-export { Box } from './Box.js'
- re-export { Sphere } from './Sphere.js'
- re-export { Plane } from './Plane.js'
- re-export { Torus } from './Torus.js'
- re-export { Cylinder } from './Cylinder.js'
- re-export { Disc } from './Disc.js'
- re-export { Cone } from './Cone.js'
- re-export { Quad } from './Quad.js'
- re-export { ThreeDF } from './ThreeDF.js'
- re-export { FullscreenTriangle } from './FullscreenTriangle.js'

### src\core\skin\Skin.ts
- **class Skin**
  - constructor(gpu: GPU, { label = 'skin', data }: SkinOptions)
  - initBones()
  - createGeometryBuffer(name: string, size: number, data: ArrayBufferView)
  - initSkinning()
  - addAnimation(animation: any)
  - getAnimation(label: string)
  - applyAnimations()
  - updateBones()
  - update(dt: number = 0)

### src\index.ts
- re-export * from './core/index.js'
- re-export * from './math/index.js'
- re-export { Orbit } from './modules/Orbit.js'
- re-export { Raycast } from './modules/Raycast.js'
- re-export { GUI } from './modules/GUI.js'
- re-export { Animation } from './modules/Animation.js'
- re-export { GLTFLoader } from './modules/GLTFLoader.js'
- re-export { CubeMap } from './modules/CubeMap.js'
- re-export { VideoTexture } from './modules/VideoTexture.js'
- re-export { KTXTexture } from './modules/KTXTexture.js'
- re-export { createStorageBuffer, createUniformBuffer, createBuffer } from './utils/BufferUtils.js'
- re-export { loadJSON, loadJSONAll } from './utils/JSONLoader.js'
- re-export { loadIBLCubeMap, loadSphericalHarmonics } from './utils/IBLUtils/IBLUtils.js'
- re-export { TimingHelper } from './utils/TimingHelper.js'
- re-export { applyOverrideConstants } from './utils/wgslOverrides.js'

### src\math\Color.ts
- **class Color** extends Float32Array
  - constructor(r?: number | string | ArrayLike<number>, g?: number, b?: number)
  - setHex(hex: number | string)
  - copy(c: ArrayLike<number>)
  - clone()
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)

### src\math\Euler.ts
- **class Euler** extends Float32Array
  - constructor(x = 0, y = 0, z = 0, order = 'YXZ')
  - copy(e: ArrayLike<number> & { order?: string })
  - clone()
  - setFromRotationMatrix(m: ArrayLike<number>, order = this.order)
  - setFromQuaternion(q: ArrayLike<number>, order = this.order)
  - reorder(order: string)
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)

### src\math\Mat3.ts
- **class Mat3** extends Float32Array
  - constructor()
  - copy(m: ArrayLike<number>)
  - clone()
  - identity()
  - multiply(m: ArrayLike<number>)
  - invert()
  - transpose()
  - fromMat4(m: ArrayLike<number>)
  - fromNormalMatrix(m: ArrayLike<number>)
  - fromQuat(q: ArrayLike<number>)
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)

### src\math\Mat4.ts
- **class Mat4** extends Float32Array
  - constructor()
  - copy(m: ArrayLike<number>)
  - clone()
  - identity()
  - multiply(m: ArrayLike<number>)
  - premultiply(m: ArrayLike<number>)
  - invert()
  - transpose()
  - fromQuat(q: ArrayLike<number>)
  - compose(position: ArrayLike<number>, quaternion: ArrayLike<number>, scale: ArrayLike<number>)
  - decompose(position: Vec3, quaternion: Quat, scale: Vec3)
  - scale(v: ArrayLike<number>)
  - translate(v: ArrayLike<number>)
  - rotateX(angle: number)
  - rotateY(angle: number)
  - rotateZ(angle: number)
  - perspective(fovy: number, aspect: number, near: number, far: number)
  - ortho(left: number, right: number, bottom: number, top: number, near: number, far: number)
  - lookAt(eye: ArrayLike<number>, target: ArrayLike<number>, up: ArrayLike<number>)
  - aim(eye: ArrayLike<number>, target: ArrayLike<number>, up: ArrayLike<number>)
  - determinant()
  - getTranslation(out: Vec3)
  - getScale(out: Vec3)
  - getRotation(out: Quat)
  - getAxis(axis: number, out: Vec3)
  - getMaxScaleOnAxis()
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)
  - inverse()
  - fromQuaternion(q: ArrayLike<number>)

### src\math\Quat.ts
- **class Quat** extends Float32Array
  - constructor(x = 0, y = 0, z = 0, w = 1)
  - copy(q: ArrayLike<number>)
  - clone()
  - identity()
  - setFromEuler(x: number, y: number, z: number, order = 'xyz')
  - setFromAxisAngle(axis: ArrayLike<number>, angle: number)
  - setFromRotationMatrix(m: ArrayLike<number>)
  - multiply(q: ArrayLike<number>)
  - premultiply(q: ArrayLike<number>)
  - rotateX(angle: number)
  - rotateY(angle: number)
  - rotateZ(angle: number)
  - slerp(q: ArrayLike<number>, t: number)
  - invert()
  - conjugate()
  - normalize()
  - dot(q: ArrayLike<number>)
  - len()
  - equals(q: ArrayLike<number>)
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)
  - fromEuler(x: number, y: number, z: number, order = 'xyz')
  - fromAxisAngle(axis: ArrayLike<number>, angle: number)
  - inverse()

### src\math\Vec2.ts
- **class Vec2** extends Float32Array
  - constructor(x = 0, y = 0)
  - copy(v: ArrayLike<number>)
  - clone()
  - add(v: ArrayLike<number>)
  - sub(v: ArrayLike<number>)
  - multiply(v: ArrayLike<number>)
  - scale(s: number)
  - multiplyScalar(s: number)
  - negate()
  - normalize()
  - lerp(v: ArrayLike<number>, t: number)
  - applyMat3(m: ArrayLike<number>)
  - dot(v: ArrayLike<number>)
  - len()
  - lenSq()
  - distance(v: ArrayLike<number>)
  - equals(v: ArrayLike<number>)
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)
  - squaredLen()

### src\math\Vec3.ts
- **class Vec3** extends Float32Array
  - constructor(x = 0, y = 0, z = 0)
  - copy(v: ArrayLike<number>)
  - clone()
  - add(v: ArrayLike<number>)
  - sub(v: ArrayLike<number>)
  - multiply(v: ArrayLike<number>)
  - scale(s: number)
  - multiplyScalar(s: number)
  - addScaled(v: ArrayLike<number>, s: number)
  - negate()
  - normalize()
  - lerp(v: ArrayLike<number>, t: number)
  - smoothLerp(v: ArrayLike<number>, decay: number, dt: number)
  - divide(v: ArrayLike<number>)
  - angle(v: ArrayLike<number>)
  - cross(v: ArrayLike<number>)
  - min(v: ArrayLike<number>)
  - max(v: ArrayLike<number>)
  - applyMat4(m: ArrayLike<number>)
  - applyMat3(m: ArrayLike<number>)
  - applyQuat(q: ArrayLike<number>)
  - scaleRotateMat4(m: ArrayLike<number>)
  - transformDirection(m: ArrayLike<number>)
  - dot(v: ArrayLike<number>)
  - len()
  - lenSq()
  - distance(v: ArrayLike<number>)
  - distanceSq(v: ArrayLike<number>)
  - equals(v: ArrayLike<number>)
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)
  - applyMatrix4(m: ArrayLike<number>)
  - applyMatrix3(m: ArrayLike<number>)
  - applyQuaternion(q: ArrayLike<number>)
  - scaleRotateMatrix4(m: ArrayLike<number>)
  - squaredLen()
  - squaredDistance(v: ArrayLike<number>)

### src\math\Vec4.ts
- **class Vec4** extends Float32Array
  - constructor(x = 0, y = 0, z = 0, w = 0)
  - copy(v: ArrayLike<number>)
  - clone()
  - add(v: ArrayLike<number>)
  - sub(v: ArrayLike<number>)
  - multiply(v: ArrayLike<number>)
  - scale(s: number)
  - multiplyScalar(s: number)
  - addScaled(v: ArrayLike<number>, s: number)
  - negate()
  - normalize()
  - lerp(v: ArrayLike<number>, t: number)
  - min(v: ArrayLike<number>)
  - max(v: ArrayLike<number>)
  - applyMat4(m: ArrayLike<number>)
  - dot(v: ArrayLike<number>)
  - len()
  - lenSq()
  - distance(v: ArrayLike<number>)
  - distanceSq(v: ArrayLike<number>)
  - equals(v: ArrayLike<number>)
  - fromArray(a: ArrayLike<number>, o = 0)
  - toArray(a: number[] = [], o = 0)
  - applyMatrix4(m: ArrayLike<number>)
  - squaredLen()
  - squaredDistance(v: ArrayLike<number>)

### src\math\index.ts
- re-export { Vec2 } from './Vec2'
- re-export { Vec3 } from './Vec3'
- re-export { Vec4 } from './Vec4'
- re-export { Quat } from './Quat'
- re-export { Mat3 } from './Mat3'
- re-export { Mat4 } from './Mat4'
- re-export { Euler } from './Euler'
- re-export { Color } from './Color'

### src\modules\Animation.ts
- **class Animation**
  - constructor({ transforms = [], label = 'animation', data = [], loop = true }: AnimationOptions = {})
  - fps(value?: number)
  - update(totalWeight = 1, isSet = false)

### src\modules\CubeMap.ts
- **class CubeMap**
  - constructor(gpu: GPU, { src = [], mips = false, flipY = false, usage = GPUTextureUsage.TEXTURE_BINDIN…)
  - destroy()

### src\modules\GLTFLoader.ts
- **class GLTFLoader**
  - constructor(gpu: GPU, { code, iblEntries = [], // override constants baked into the shader (e.g. roug…)
  - load(url: string)
  - getSkinData(meshOrIndex: number | any = 0)
  - getGeometryData(meshOrIndex: number | any = 0)
  - getGeometry(meshOrIndex: number | any = 0)
  - getAnimation({ animation = 0, skin = 0, fps = 30 }: { animation?: number; skin?: number; fps?: number …)

### src\modules\GUI.ts
- **class GUI**
  - constructor({ title = 'OGPU', expanded = false, container, pane }: GUIOptions = {})
  - add(obj: object, key: string, opts: any = {})
  - monitor(obj: object, key: string, opts: any = {})
  - button(title: string, onClick: () => void)
  - folder(title: string, { expanded = true }: { expanded?: boolean } = {})
  - uniform(target: UniformTarget, key: string, opts: any = {})
  - dispose()

### src\modules\KTXTexture.ts
- **class KTXTexture** extends Texture
  - constructor(gpu: GPU, { src, usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST, labe…)

### src\modules\Orbit.ts
- const `Orbit`

### src\modules\Raycast.ts
- **class Raycast**
  - constructor()
  - castMouse(camera: Camera, mouse: [number, number] = [0, 0])
  - intersectBounds(meshes: Mesh | Mesh[], { maxDistance, output = [] }: RaycastBoundsOptions = {})
  - intersectMeshes(meshes: Mesh | Mesh[], { cullFace = true, maxDistance, includeUV = true, includeNormal = …)
  - intersectPlane(plane: Plane, origin = this.origin, direction = this.direction, out: Vec3 | null = null)
  - intersectSphere(sphere: Pick<Bounds, 'center' | 'radius'>, origin = this.origin, direction = this.directi…)
  - intersectBox(box: Pick<Bounds, 'min' | 'max'>, origin = this.origin, direction = this.direction)
  - intersectTriangle(a: Vec3, b: Vec3, c: Vec3, backfaceCulling = true, origin = this.origin, direction = this…)
  - getBarycoord(point: Vec3, a: Vec3, b: Vec3, c: Vec3, target = tempVec3h)

### src\modules\VideoTexture.ts
- **class VideoTexture**
  - constructor(gpu: GPU, { video, format = 'rgba8unorm', label = '', autoStart = true, flipY = false }: …)
  - start()
  - stop()
  - createView()
  - destroy()

### src\utils\BufferUtils.ts
- fn `createStorageBuffer(gpu: GPU, { label = 'storage buffer', size = null, usage = GPUBufferUsage.COPY_DST | GPUB…)`
- fn `createUniformBuffer(gpu: GPU, { label = 'uniform buffer', size = null, usage = GPUBufferUsage.COPY_DST }: Uni…)`
- fn `createBuffer(gpu: GPU, { label = 'buffer', size = null, usage = GPUBufferUsage.COPY_DST | GPUBufferUsa…)`

### src\utils\EulerUtils.ts
- fn `fromRotationMatrix(m: ArrayLike<number>, order: string = 'YXZ', out: { [index: number]: number })`

### src\utils\IBLUtils\IBLUtils.ts
- fn `loadIBLCubeMap(gpu: GPU, { url, faceSize = DEFAULT_FACE_SIZE, mipLevels = null, label = 'IBL cube' }: IB…)`
- fn `loadSphericalHarmonics(url: string)`

### src\utils\JSONLoader.ts
- fn `loadJSON(url: string, opts?: RequestInit)`
- fn `loadJSONAll(urls: string[], opts?: RequestInit)`

### src\utils\Mat3Utils.ts
- fn `adjugate(m: any, dstMat: any)`

### src\utils\Mat4Utils.ts
- fn `compose(dstMat: ArrayLike<number> & { [index: number]: number }, srcRotation: ArrayLike<number>, …)`
- fn `decompose(srcMat: any, dstRotation: any, dstTranslation: { [index: number]: number }, dstScale: { […)`

### src\utils\TimingHelper.ts
- **class TimingHelper**
  - constructor(device: GPUDevice)
  - beginRenderPass(encoder: GPUCommandEncoder, descriptor: GPURenderPassDescriptor = {} as GPURenderPassDesc…)
  - beginComputePass(encoder: GPUCommandEncoder, descriptor: GPUComputePassDescriptor = {})
  - getResult()

### src\utils\ktxutils.ts
- fn `formatBlockInfo(format: string)`
- fn `parseKTXHeader(u8: Uint8Array)`
- fn `vkFormatToWebGPU(fmt: number)`
- fn `glFormatToWebGPU(fmt: number)`

### src\utils\miscutils.ts
- **class NonNegativeRollingAverage**
  - constructor(numSamples: number = 30)
  - addSample(v: number)

### src\utils\utils.ts
- const `getPromise`

### src\utils\wgslOverrides.ts
- fn `applyOverrideConstants(code: string, constants: Record<string, number> = {})`
