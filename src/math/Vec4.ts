import { vec4 } from 'wgpu-matrix';

/**
 * 4-component vector. Subclasses Float32Array so it stays a drop-in
 * argument for any wgpu-matrix call, while adding a three.js-style
 * chainable API: `v.set(1, 2, 3, 4).add(other).normalize()`.
 */
export class Vec4 extends Float32Array {
    constructor(x = 0, y = 0, z = 0, w = 0) {
        super(4);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
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
    get w(): number {
        return this[3];
    }
    set w(v: number) {
        this[3] = v;
    }

    /**
     * `set(x, y, z, w)` sets components. Falls back to the native
     * `Float32Array.set(arrayLike, offset)` when handed an array.
     */
    set(x: number | ArrayLike<number>, y?: number, z?: number, w?: number): this {
        if (typeof x === 'object' && x !== null) {
            super.set(x, y);
            return this;
        }
        this[0] = x;
        if (y !== undefined) this[1] = y;
        if (z !== undefined) this[2] = z;
        if (w !== undefined) this[3] = w;
        return this;
    }

    copy(v: ArrayLike<number>): this {
        this[0] = v[0];
        this[1] = v[1];
        this[2] = v[2];
        this[3] = v[3];
        return this;
    }

    clone(): Vec4 {
        return new Vec4(this[0], this[1], this[2], this[3]);
    }

    add(v: ArrayLike<number>): this {
        vec4.add(this, v, this);
        return this;
    }

    sub(v: ArrayLike<number>): this {
        vec4.subtract(this, v, this);
        return this;
    }

    multiply(v: ArrayLike<number>): this {
        vec4.multiply(this, v, this);
        return this;
    }

    scale(s: number): this {
        vec4.scale(this, s, this);
        return this;
    }

    // three.js alias for scale.
    multiplyScalar(s: number): this {
        vec4.scale(this, s, this);
        return this;
    }

    addScaled(v: ArrayLike<number>, s: number): this {
        vec4.addScaled(this, v, s, this);
        return this;
    }

    negate(): this {
        vec4.negate(this, this);
        return this;
    }

    normalize(): this {
        vec4.normalize(this, this);
        return this;
    }

    lerp(v: ArrayLike<number>, t: number): this {
        vec4.lerp(this, v, t, this);
        return this;
    }

    min(v: ArrayLike<number>): this {
        vec4.min(this, v, this);
        return this;
    }

    max(v: ArrayLike<number>): this {
        vec4.max(this, v, this);
        return this;
    }

    applyMat4(m: ArrayLike<number>): this {
        vec4.transformMat4(this, m, this);
        return this;
    }

    dot(v: ArrayLike<number>): number {
        return vec4.dot(this, v);
    }

    len(): number {
        return vec4.length(this);
    }

    lenSq(): number {
        return vec4.lengthSq(this);
    }

    distance(v: ArrayLike<number>): number {
        return vec4.distance(this, v);
    }

    distanceSq(v: ArrayLike<number>): number {
        return vec4.distanceSq(this, v);
    }

    equals(v: ArrayLike<number>): boolean {
        return this[0] === v[0] && this[1] === v[1] && this[2] === v[2] && this[3] === v[3];
    }

    fromArray(a: ArrayLike<number>, o = 0): this {
        this[0] = a[o];
        this[1] = a[o + 1];
        this[2] = a[o + 2];
        this[3] = a[o + 3];
        return this;
    }

    toArray(a: number[] = [], o = 0): number[] {
        a[o] = this[0];
        a[o + 1] = this[1];
        a[o + 2] = this[2];
        a[o + 3] = this[3];
        return a;
    }

    // alternate-name aliases
    applyMatrix4(m: ArrayLike<number>): this {
        return this.applyMat4(m);
    }
    squaredLen(): number {
        return this.lenSq();
    }
    squaredDistance(v: ArrayLike<number>): number {
        return this.distanceSq(v);
    }
}
