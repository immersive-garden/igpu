import { mat4 } from 'wgpu-matrix';
import { fromRotationMatrix } from '@utils/EulerUtils';
import { Quat } from './Quat';

// Scratch for reorder().
const _q = new Quat();

/**
 * Euler angles (x, y, z radians) with a rotation order (default YXZ). Subclasses
 * Float32Array for a chainable three.js-style API. Pairs with Quat via
 * `setFromQuaternion` (Quat→Euler) and `Quat.setFromEuler` (Euler→Quat).
 *
 * onChange contract (mirror of Quat): mutators fire `onChange()` so Transform
 * re-derives the quaternion. Exception: `setFromQuaternion` detaches onChange
 * while it runs (Quat→Euler direction) to avoid looping.
 */
export class Euler extends Float32Array {
    order: string;
    onChange: () => void;

    constructor(x = 0, y = 0, z = 0, order = 'YXZ') {
        super(3);
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this.order = order;
        // Fired after any mutation. Transform wires this to keep `quaternion`
        // in sync. `setFromQuaternion` is the Quat→Euler direction and detaches
        // it to avoid looping. Default is a noop.
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

    set(x: number | ArrayLike<number>, y?: number, z?: number, order = this.order): this {
        if (typeof x === 'object' && x !== null) {
            super.set(x, y);
            this.onChange();
            return this;
        }
        this[0] = x;
        if (y !== undefined) this[1] = y;
        if (z !== undefined) this[2] = z;
        this.order = order;
        this.onChange();
        return this;
    }

    copy(e: ArrayLike<number> & { order?: string }): this {
        this[0] = e[0];
        this[1] = e[1];
        this[2] = e[2];
        if (e.order) this.order = e.order;
        this.onChange();
        return this;
    }

    clone(): Euler {
        return new Euler(this[0], this[1], this[2], this.order);
    }

    setFromRotationMatrix(m: ArrayLike<number>, order = this.order): this {
        fromRotationMatrix(m, order, this);
        this.order = order;
        this.onChange();
        return this;
    }

    // Quat→Euler direction: detach onChange so re-deriving angles from the
    // quaternion doesn't fire back into Transform's Euler→Quat sync.
    setFromQuaternion(q: ArrayLike<number>, order = this.order): this {
        const cb = this.onChange;
        this.onChange = () => {};
        this.setFromRotationMatrix(mat4.fromQuat(q), order);
        this.onChange = cb;
        return this;
    }

    // Re-express same orientation in a new order. Round-trips via quat.
    reorder(order: string): this {
        _q.setFromEuler(this[0], this[1], this[2], this.order.toLowerCase());
        this.setFromQuaternion(_q, order);
        this.onChange();
        return this;
    }

    fromArray(a: ArrayLike<number>, o = 0): this {
        this[0] = a[o];
        this[1] = a[o + 1];
        this[2] = a[o + 2];
        this.onChange();
        return this;
    }

    toArray(a: number[] = [], o = 0): number[] {
        a[o] = this[0];
        a[o + 1] = this[1];
        a[o + 2] = this[2];
        return a;
    }
}
