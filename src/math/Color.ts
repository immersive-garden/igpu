/**
 * Linear RGB color (r, g, b in 0..1). Subclasses Float32Array for drop-in
 * interop plus a chainable three.js-style API. Accepts loose inputs:
 *
 *   new Color()                 // black
 *   new Color(0.2, 0.4, 1)      // rgb components
 *   new Color(0.5)              // grey (single value → r=g=b)
 *   new Color('#ff8800')        // hex string (3- or 6-digit, '#' optional)
 *   new Color(0xff8800)         // hex number
 *   new Color([r, g, b])        // array
 *
 * Hex inputs are treated as sRGB byte values and divided by 255 (no gamma
 * conversion; convert yourself if you need linear).
 */
export class Color extends Float32Array {
    constructor(r?: number | string | ArrayLike<number>, g?: number, b?: number) {
        super(3);
        this.set(r, g, b);
    }

    get r(): number {
        return this[0];
    }
    set r(v: number) {
        this[0] = v;
    }
    get g(): number {
        return this[1];
    }
    set g(v: number) {
        this[1] = v;
    }
    get b(): number {
        return this[2];
    }
    set b(v: number) {
        this[2] = v;
    }

    set(r?: number | string | ArrayLike<number>, g?: number, b?: number): this {
        if (typeof r === 'string') return this.setHex(r);
        if (typeof r === 'number' && g === undefined) {
            // single number: hex (>1) or grey scalar (0..1)
            if (r > 1) return this.setHex(r);
            this[0] = this[1] = this[2] = r;
            return this;
        }
        if (Array.isArray(r) || ArrayBuffer.isView(r)) {
            const a = r as ArrayLike<number>;
            this[0] = a[0];
            this[1] = a[1];
            this[2] = a[2];
            return this;
        }
        this[0] = (r as number) || 0;
        this[1] = g || 0;
        this[2] = b || 0;
        return this;
    }

    setHex(hex: number | string): this {
        if (typeof hex === 'string') {
            hex = hex.replace('#', '');
            if (hex.length === 3) {
                hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
            }
            hex = parseInt(hex, 16);
        }
        this[0] = ((hex >> 16) & 255) / 255;
        this[1] = ((hex >> 8) & 255) / 255;
        this[2] = (hex & 255) / 255;
        return this;
    }

    copy(c: ArrayLike<number>): this {
        this[0] = c[0];
        this[1] = c[1];
        this[2] = c[2];
        return this;
    }

    clone(): Color {
        return new Color(this[0], this[1], this[2]);
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
}
