import { Transform } from './Transform.js';
import { Mat4, Vec3 } from '@math';

const tempMat4 = /* @__PURE__ */ new Mat4();
const tempVec3a = /* @__PURE__ */ new Vec3();
const tempVec3b = /* @__PURE__ */ new Vec3();

export interface CameraOptions {
    near?: number;
    far?: number;
    fov?: number;
    aspect?: number;
    left?: number;
    right?: number;
    bottom?: number;
    top?: number;
    zoom?: number;
}

// FrustumPlane is a Vec3 with an extra `constant` property tacked on.
type FrustumPlane = Vec3 & { constant: number };

// Camera node (perspective, or orthographic when left/right set) + frustum culling.
export class Camera extends Transform {
    near!: number;
    far!: number;
    fov!: number;
    aspect!: number;
    left: number | undefined;
    right: number | undefined;
    bottom: number | undefined;
    top: number | undefined;
    zoom!: number;
    type: 'perspective' | 'orthographic';
    projectionMatrix: Mat4;
    viewMatrix: Mat4;
    projectionViewMatrix: Mat4;
    worldPosition: Vec3;
    frustum?: FrustumPlane[];

    constructor({ near = 0.1, far = 100, fov = 45, aspect = 1, left, right, bottom, top, zoom = 1 }: CameraOptions = {}) {
        super();

        Object.assign(this, { near, far, fov, aspect, left, right, bottom, top, zoom });

        this.projectionMatrix = new Mat4();
        this.viewMatrix = new Mat4();
        this.projectionViewMatrix = new Mat4();
        this.worldPosition = new Vec3(0, 0, 0);

        // Use orthographic if left/right set, else default to perspective camera
        this.type = left || right ? 'orthographic' : 'perspective';

        if (this.type === 'orthographic') this.orthographic();
        else this.perspective();
    }

    perspective({ near = this.near, far = this.far, fov = this.fov, aspect = this.aspect }: CameraOptions = {}): this {
        Object.assign(this, { near, far, fov, aspect });
        // fov is stored in degrees; wgpu-matrix's perspective wants radians.
        this.projectionMatrix.perspective((fov * Math.PI) / 180, aspect, near, far);
        this.type = 'perspective';
        return this;
    }

    orthographic({ near = this.near, far = this.far, left = this.left ?? -1, right = this.right ?? 1, bottom = this.bottom ?? -1, top = this.top ?? 1, zoom = this.zoom }: CameraOptions = {}): this {
        Object.assign(this, { near, far, left, right, bottom, top, zoom });
        left /= zoom;
        right /= zoom;
        bottom /= zoom;
        top /= zoom;
        this.projectionMatrix.ortho(left, right, bottom, top, near, far);
        this.type = 'orthographic';
        return this;
    }

    updateMatrixWorld(force?: boolean): void {
        super.updateMatrixWorld(force);
        this.viewMatrix.copy(this.worldMatrix).invert();
        this.worldMatrix.getTranslation(this.worldPosition);

        this.projectionViewMatrix.copy(this.projectionMatrix).multiply(this.viewMatrix);
    }

    updateProjectionMatrix(): this {
        if (this.type === 'perspective') {
            return this.perspective();
        } else {
            return this.orthographic();
        }
    }

    lookAt(target: ArrayLike<number>): this {
        super.lookAt(target, true);
        return this;
    }

    // Project 3D coordinate to 2D point
    project(v: Vec3): this {
        v.applyMat4(this.viewMatrix).applyMat4(this.projectionMatrix);
        return this;
    }

    // Unproject 2D point to 3D coordinate
    unproject(v: Vec3): this {
        tempMat4.copy(this.projectionMatrix).invert();
        v.applyMat4(tempMat4).applyMat4(this.worldMatrix);
        return this;
    }

    updateFrustum(): void {
        if (!this.frustum) {
            this.frustum = [new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3(), new Vec3()] as FrustumPlane[];
        }

        // Gribb-Hartmann plane extraction. WebGPU clip z is [0, 1] (not GL's
        // [-1, 1]), so the near plane is row 3 alone instead of row3 + row2.
        const m = this.projectionViewMatrix;
        this.frustum[0].set(m[3] - m[0], m[7] - m[4], m[11] - m[8]).constant = m[15] - m[12]; // -x
        this.frustum[1].set(m[3] + m[0], m[7] + m[4], m[11] + m[8]).constant = m[15] + m[12]; // +x
        this.frustum[2].set(m[3] + m[1], m[7] + m[5], m[11] + m[9]).constant = m[15] + m[13]; // +y
        this.frustum[3].set(m[3] - m[1], m[7] - m[5], m[11] - m[9]).constant = m[15] - m[13]; // -y
        this.frustum[4].set(m[3] - m[2], m[7] - m[6], m[11] - m[10]).constant = m[15] - m[14]; // +z (far)
        this.frustum[5].set(m[2], m[6], m[10]).constant = m[14]; // -z (near)

        for (let i = 0; i < 6; i++) {
            const invLen = 1.0 / this.frustum[i].len();
            this.frustum[i].scale(invLen);
            this.frustum[i].constant *= invLen;
        }
    }

    frustumIntersectsMesh(node: any, worldMatrix: Mat4 = node.worldMatrix): boolean {
        const geometry = node.geometry;
        if (!geometry) return true;

        if (!geometry.bounds || geometry.bounds.radius === Infinity) {
            // Indirect/instanced draws and vertex-pulled meshes have no
            // CPU-derivable extent — without explicit bounds, never cull.
            if (geometry.instanced) return true;
            if (!geometry.attributes?.position) return true;
            geometry.computeBoundingSphere();
        }

        if (!geometry.bounds || geometry.bounds.radius === Infinity) return true;

        const center = tempVec3a;
        center.copy(geometry.bounds.center);
        center.applyMat4(worldMatrix);

        const radius = geometry.bounds.radius * worldMatrix.getMaxScaleOnAxis();

        return this.frustumIntersectsSphere(center, radius);
    }

    frustumIntersectsSphere(center: Vec3, radius: number): boolean {
        const normal = tempVec3b;

        for (let i = 0; i < 6; i++) {
            const plane = this.frustum![i];
            const distance = normal.copy(plane).dot(center) + plane.constant;
            if (distance < -radius) return false;
        }
        return true;
    }

    getFrustumSize(z?: number): { width: number; height: number } {
        const height = Math.tan(this.fov * (Math.PI / 180.0) * 0.5) * (z || this.far);
        const width = height * this.aspect;
        return { width, height };
    }
}
