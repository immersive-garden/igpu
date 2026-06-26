import { mat4, quat } from 'wgpu-matrix';
import { compose, decompose } from '@utils/Mat4Utils';
import type { Vec3 } from './Vec3';
import type { Quat } from './Quat';

/**
 * 4x4 column-major matrix. Subclasses Float32Array for drop-in
 * wgpu-matrix interop plus a chainable three.js-style API.
 * Defaults to identity.
 */
export class Mat4 extends Float32Array {
    constructor() {
        super(16);
        mat4.identity(this);
    }

    set(array: ArrayLike<number>, offset?: number): this;
    set(...values: number[]): this;
    set(...values: any[]): this {
        if (values.length === 1 && typeof values[0] === 'object') {
            super.set(values[0] as ArrayLike<number>, values[1] as number);
            return this;
        }
        for (let i = 0; i < 16; i++) this[i] = values[i];
        return this;
    }

    copy(m: ArrayLike<number>): this {
        mat4.copy(m, this);
        return this;
    }

    clone(): Mat4 {
        return new Mat4().copy(this);
    }

    identity(): this {
        mat4.identity(this);
        return this;
    }

    multiply(m: ArrayLike<number>): this {
        mat4.multiply(this, m, this);
        return this;
    }

    premultiply(m: ArrayLike<number>): this {
        mat4.multiply(m, this, this);
        return this;
    }

    invert(): this {
        mat4.inverse(this, this);
        return this;
    }

    transpose(): this {
        mat4.transpose(this, this);
        return this;
    }

    fromQuat(q: ArrayLike<number>): this {
        mat4.fromQuat(q, this);
        return this;
    }

    /** Build from translation / rotation (quat) / scale. */
    compose(position: ArrayLike<number>, quaternion: ArrayLike<number>, scale: ArrayLike<number>): this {
        compose(this, quaternion, position, scale);
        return this;
    }

    /** Extract translation / rotation (quat) / scale into the passed targets. */
    decompose(position: Vec3, quaternion: Quat, scale: Vec3): this {
        decompose(this, quaternion, position, scale);
        return this;
    }

    scale(v: ArrayLike<number>): this {
        mat4.scale(this, v, this);
        return this;
    }

    translate(v: ArrayLike<number>): this {
        mat4.translate(this, v, this);
        return this;
    }

    rotateX(angle: number): this {
        mat4.rotateX(this, angle, this);
        return this;
    }

    rotateY(angle: number): this {
        mat4.rotateY(this, angle, this);
        return this;
    }

    rotateZ(angle: number): this {
        mat4.rotateZ(this, angle, this);
        return this;
    }

    perspective(fovy: number, aspect: number, near: number, far: number): this {
        mat4.perspective(fovy, aspect, near, far, this);
        return this;
    }

    ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): this {
        mat4.ortho(left, right, bottom, top, near, far, this);
        return this;
    }

    lookAt(eye: ArrayLike<number>, target: ArrayLike<number>, up: ArrayLike<number>): this {
        mat4.lookAt(eye, target, up, this);
        return this;
    }

    /**
     * Object-orientation matrix: +Z aimed from `eye` toward `target`.
     * This is the inverse-handed counterpart to `lookAt` (which builds a
     * view matrix). Use for orienting a node, not a camera.
     */
    aim(eye: ArrayLike<number>, target: ArrayLike<number>, up: ArrayLike<number>): this {
        mat4.aim(eye, target, up, this);
        return this;
    }

    determinant(): number {
        return mat4.determinant(this);
    }

    getTranslation(out: Vec3): Vec3 {
        return mat4.getTranslation(this, out) as Vec3;
    }

    getScale(out: Vec3): Vec3 {
        return mat4.getScaling(this, out) as Vec3;
    }

    getRotation(out: Quat): Quat {
        return quat.fromMat(this, out) as Quat;
    }

    getAxis(axis: number, out: Vec3): Vec3 {
        return mat4.getAxis(this, axis, out) as Vec3;
    }

    // Largest per-axis scale factor — bounds how much this matrix can grow a
    // length (used to scale bounding-sphere radii into world space).
    getMaxScaleOnAxis(): number {
        const sx = this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
        const sy = this[4] * this[4] + this[5] * this[5] + this[6] * this[6];
        const sz = this[8] * this[8] + this[9] * this[9] + this[10] * this[10];
        return Math.sqrt(Math.max(sx, sy, sz));
    }

    fromArray(a: ArrayLike<number>, o = 0): this {
        for (let i = 0; i < 16; i++) this[i] = a[o + i];
        return this;
    }

    toArray(a: number[] = [], o = 0): number[] {
        for (let i = 0; i < 16; i++) a[o + i] = this[i];
        return a;
    }

    // alternate-name aliases
    inverse(): this {
        return this.invert();
    }
    fromQuaternion(q: ArrayLike<number>): this {
        return this.fromQuat(q);
    }
}
