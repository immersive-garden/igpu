import { vec3 } from 'wgpu-matrix';

/**
 * 3-component vector. Subclasses Float32Array so it stays a drop-in
 * argument for any wgpu-matrix call, while adding a three.js-style
 * chainable API: `v.set(1, 2, 3).add(other).normalize()`.
 */
export class Vec3 extends Float32Array {
    // Optional constant tag (e.g. used by axis constants).
    constant?: number;

    constructor(x = 0, y = 0, z = 0) {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
    }

    get x(): number {
        return this[0];
    }
    set x(v: number) {
        this[0] = v;
    }
    get y(): number {
        return this[1];
    }
    set y(v: number) {
        this[1] = v;
    }
    get z(): number {
        return this[2];
    }
    set z(v: number) {
        this[2] = v;
    }

    /**
     * `set(x, y, z)` sets components. Falls back to the native
     * `Float32Array.set(arrayLike, offset)` when handed an array.
     */
    set(x: number | ArrayLike<number>, y?: number, z?: number): this {
        if (typeof x === 'object' && x !== null) {
            super.set(x, y);
            return this;
        }
        this[0] = x;
        if (y !== undefined) this[1] = y;
        if (z !== undefined) this[2] = z;
        return this;
    }

    copy(v: ArrayLike<number>): this {
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2];
        return this;
    }

    clone(): Vec3 {
        return new Vec3(this[0], this[1], this[2]);
    }

    add(v: ArrayLike<number>): this {
        vec3.add(this, v, this);
        return this;
    }

    sub(v: ArrayLike<number>): this {
        vec3.subtract(this, v, this);
        return this;
    }

    multiply(v: ArrayLike<number>): this {
        vec3.multiply(this, v, this);
        return this;
    }

    scale(s: number): this {
        vec3.scale(this, s, this);
        return this;
    }

    // three.js alias for scale.
    multiplyScalar(s: number): this {
        vec3.scale(this, s, this);
        return this;
    }

    addScaled(v: ArrayLike<number>, s: number): this {
        vec3.addScaled(this, v, s, this);
        return this;
    }

    negate(): this {
        vec3.negate(this, this);
        return this;
    }

    normalize(): this {
        vec3.normalize(this, this);
        return this;
    }

    lerp(v: ArrayLike<number>, t: number): this {
        vec3.lerp(this, v, t, this);
        return this;
    }

    // fps-independent smoothing toward v. t = 1 - exp(-decay*dt).
    smoothLerp(v: ArrayLike<number>, decay: number, dt: number): this {
        const t = 1 - Math.exp(-decay * dt);
        vec3.lerp(this, v, t, this);
        return this;
    }

    divide(v: ArrayLike<number>): this {
        vec3.divide(this, v, this);
        return this;
    }

    // angle (radians) to v.
    angle(v: ArrayLike<number>): number {
        return vec3.angle(this, v);
    }

    cross(v: ArrayLike<number>): this {
        vec3.cross(this, v, this);
        return this;
    }

    min(v: ArrayLike<number>): this {
        vec3.min(this, v, this);
        return this;
    }

    max(v: ArrayLike<number>): this {
        vec3.max(this, v, this);
        return this;
    }

    applyMat4(m: ArrayLike<number>): this {
        vec3.transformMat4(this, m, this);
        return this;
    }

    applyMat3(m: ArrayLike<number>): this {
        vec3.transformMat3(this, m, this);
        return this;
    }

    applyQuat(q: ArrayLike<number>): this {
        vec3.transformQuat(this, q, this);
        return this;
    }

    // Transform by the rotation/scale part of a Mat4 (no translation, no
    // perspective divide). Keeps length scaling — use for converting
    // distances between spaces.
    scaleRotateMat4(m: ArrayLike<number>): this {
        vec3.transformMat4Upper3x3(this, m, this);
        return this;
    }

    // Transform as a direction: rotation/scale part of a Mat4, then normalize.
    transformDirection(m: ArrayLike<number>): this {
        vec3.transformMat4Upper3x3(this, m, this);
        return this.normalize();
    }

    dot(v: ArrayLike<number>): number {
        return vec3.dot(this, v);
    }

    len(): number {
        return vec3.length(this);
    }

    lenSq(): number {
        return vec3.lengthSq(this);
    }

    distance(v: ArrayLike<number>): number {
        return vec3.distance(this, v);
    }

    distanceSq(v: ArrayLike<number>): number {
        return vec3.distanceSq(this, v);
    }

    equals(v: ArrayLike<number>): boolean {
        return this[0] === v[0] && this[1] === v[1] && this[2] === v[2];
    }

    fromArray(a: ArrayLike<number>, o = 0): this {
        this[0] = a[o];
        this[1] = a[o + 1];
        this[2] = a[o + 2];
        return this;
    }

    toArray(a: number[] = [], o = 0): number[] {
        a[o] = this[0];
        a[o + 1] = this[1];
        a[o + 2] = this[2];
        return a;
    }

    // alternate-name aliases
    applyMatrix4(m: ArrayLike<number>): this {
        return this.applyMat4(m);
    }
    applyMatrix3(m: ArrayLike<number>): this {
        return this.applyMat3(m);
    }
    applyQuaternion(q: ArrayLike<number>): this {
        return this.applyQuat(q);
    }
    scaleRotateMatrix4(m: ArrayLike<number>): this {
        return this.scaleRotateMat4(m);
    }
    squaredLen(): number {
        return this.lenSq();
    }
    squaredDistance(v: ArrayLike<number>): number {
        return this.distanceSq(v);
    }
}
