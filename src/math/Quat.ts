import { quat } from 'wgpu-matrix';

/**
 * Quaternion (x, y, z, w). Subclasses Float32Array for drop-in wgpu-matrix
 * interop plus a chainable three.js-style API.
 */
export class Quat extends Float32Array {
    onChange: () => void;

    constructor(x = 0, y = 0, z = 0, w = 1) {
        super(4);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
        // Fired after any mutation. Transform wires this to keep `rotation`
        // (Euler) in sync. `setFromEuler` deliberately does NOT fire it — that
        // is the Euler→Quat direction and firing would loop. Default is a noop.
        this.onChange = () => {};
    }

    get x(): number {
        return this[0];
    }
    set x(v: number) {
        this[0] = v;
        this.onChange();
    }
    get y(): number {
        return this[1];
    }
    set y(v: number) {
        this[1] = v;
        this.onChange();
    }
    get z(): number {
        return this[2];
    }
    set z(v: number) {
        this[2] = v;
        this.onChange();
    }
    get w(): number {
        return this[3];
    }
    set w(v: number) {
        this[3] = v;
        this.onChange();
    }

    set(x: number | ArrayLike<number>, y?: number, z?: number, w?: number): this {
        if (typeof x === 'object' && x !== null) {
            super.set(x, y);
            this.onChange();
            return this;
        }
        this[0] = x;
        if (y !== undefined) this[1] = y;
        if (z !== undefined) this[2] = z;
        if (w !== undefined) this[3] = w;
        this.onChange();
        return this;
    }

    copy(q: ArrayLike<number>): this {
        this[0] = q[0];
        this[1] = q[1];
        this[2] = q[2];
        this[3] = q[3];
        this.onChange();
        return this;
    }

    clone(): Quat {
        return new Quat(this[0], this[1], this[2], this[3]);
    }

    identity(): this {
        quat.identity(this);
        this.onChange();
        return this;
    }

    // Euler→Quat direction: intentionally does NOT fire onChange (would loop
    // against Transform's rotation sync).
    setFromEuler(x: number, y: number, z: number, order = 'xyz'): this {
        quat.fromEuler(x, y, z, order as any, this);
        return this;
    }

    setFromAxisAngle(axis: ArrayLike<number>, angle: number): this {
        quat.fromAxisAngle(axis, angle, this);
        this.onChange();
        return this;
    }

    setFromRotationMatrix(m: ArrayLike<number>): this {
        quat.fromMat(m, this);
        this.onChange();
        return this;
    }

    multiply(q: ArrayLike<number>): this {
        quat.mul(this, q, this);
        this.onChange();
        return this;
    }

    premultiply(q: ArrayLike<number>): this {
        quat.mul(q, this, this);
        this.onChange();
        return this;
    }

    rotateX(angle: number): this {
        quat.rotateX(this, angle, this);
        this.onChange();
        return this;
    }

    rotateY(angle: number): this {
        quat.rotateY(this, angle, this);
        this.onChange();
        return this;
    }

    rotateZ(angle: number): this {
        quat.rotateZ(this, angle, this);
        this.onChange();
        return this;
    }

    slerp(q: ArrayLike<number>, t: number): this {
        quat.slerp(this, q, t, this);
        this.onChange();
        return this;
    }

    invert(): this {
        quat.inverse(this, this);
        this.onChange();
        return this;
    }

    conjugate(): this {
        quat.conjugate(this, this);
        this.onChange();
        return this;
    }

    normalize(): this {
        quat.normalize(this, this);
        this.onChange();
        return this;
    }

    dot(q: ArrayLike<number>): number {
        return quat.dot(this, q);
    }

    len(): number {
        return quat.length(this);
    }

    equals(q: ArrayLike<number>): boolean {
        return this[0] === q[0] && this[1] === q[1] && this[2] === q[2] && this[3] === q[3];
    }

    fromArray(a: ArrayLike<number>, o = 0): this {
        this[0] = a[o];
        this[1] = a[o + 1];
        this[2] = a[o + 2];
        this[3] = a[o + 3];
        this.onChange();
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
    fromEuler(x: number, y: number, z: number, order = 'xyz'): this {
        return this.setFromEuler(x, y, z, order);
    }
    fromAxisAngle(axis: ArrayLike<number>, angle: number): this {
        return this.setFromAxisAngle(axis, angle);
    }
    inverse(): this {
        return this.invert();
    }
}
