import { vec2 } from 'wgpu-matrix';

/**
 * 2-component vector. Subclasses Float32Array for drop-in wgpu-matrix
 * interop plus a chainable three.js-style API.
 */
export class Vec2 extends Float32Array {
    constructor(x = 0, y = 0) {
        super(2);
        this[0] = x;
        this[1] = y;
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

    set(x: number | ArrayLike<number>, y?: number): this {
        if (typeof x === 'object' && x !== null) {
            super.set(x, y);
            return this;
        }
        this[0] = x;
        if (y !== undefined) this[1] = y;
        return this;
    }

    copy(v: ArrayLike<number>): this {
        this[0] = v[0];
        this[1] = v[1];
        return this;
    }

    clone(): Vec2 {
        return new Vec2(this[0], this[1]);
    }

    add(v: ArrayLike<number>): this {
        vec2.add(this, v, this);
        return this;
    }

    sub(v: ArrayLike<number>): this {
        vec2.subtract(this, v, this);
        return this;
    }

    multiply(v: ArrayLike<number>): this {
        vec2.multiply(this, v, this);
        return this;
    }

    scale(s: number): this {
        vec2.scale(this, s, this);
        return this;
    }

    // three.js alias for scale.
    multiplyScalar(s: number): this {
        vec2.scale(this, s, this);
        return this;
    }

    negate(): this {
        vec2.negate(this, this);
        return this;
    }

    normalize(): this {
        vec2.normalize(this, this);
        return this;
    }

    lerp(v: ArrayLike<number>, t: number): this {
        vec2.lerp(this, v, t, this);
        return this;
    }

    applyMat3(m: ArrayLike<number>): this {
        const x = this[0] * m[0] + this[1] * m[3] + m[6];
        const y = this[0] * m[1] + this[1] * m[4] + m[7];
        this[0] = x;
        this[1] = y;
        return this;
    }

    dot(v: ArrayLike<number>): number {
        return vec2.dot(this, v);
    }

    len(): number {
        return vec2.length(this);
    }

    lenSq(): number {
        return vec2.lengthSq(this);
    }

    distance(v: ArrayLike<number>): number {
        return vec2.distance(this, v);
    }

    equals(v: ArrayLike<number>): boolean {
        return this[0] === v[0] && this[1] === v[1];
    }

    fromArray(a: ArrayLike<number>, o = 0): this {
        this[0] = a[o];
        this[1] = a[o + 1];
        return this;
    }

    toArray(a: number[] = [], o = 0): number[] {
        a[o] = this[0];
        a[o + 1] = this[1];
        return a;
    }

    // alternate-name aliases
    squaredLen(): number {
        return this.lenSq();
    }
}
