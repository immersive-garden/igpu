// Cross-cutting types shared across the engine. Per-class option interfaces
// live next to their class; only genuinely engine-wide shapes belong here.

import type { Renderer } from '@core/Renderer';
import type { Vec3 } from '@math/Vec3';

/**
 * The augmented canvas context threaded through nearly every constructor.
 * A `GPUCanvasContext` with `.device`, `.presentationFormat` and a
 * back-reference `.renderer` attached by `Renderer.init`. Classes take THIS,
 * never the raw `GPUDevice`.
 */
export interface GPU extends GPUCanvasContext {
    /** Narrowed from `HTMLCanvasElement | OffscreenCanvas`: the engine only ever
     * runs against a real on-screen canvas. */
    canvas: HTMLCanvasElement;
    device: GPUDevice;
    presentationFormat: GPUTextureFormat;
    renderer: Renderer;
}

/** RGBA clear color in 0..1. */
export interface ClearColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

/** Axis-aligned bounds + bounding sphere, lazily computed by Geometry. */
export interface Bounds {
    min: Vec3;
    max: Vec3;
    center: Vec3;
    scale: Vec3;
    /** `Infinity` until computeBoundingSphere() runs. */
    radius: number;
}

/**
 * A reflected, structured uniform view (webgpu-utils `makeStructuredView`).
 * `views` maps each struct field to a typed-array view over `arrayBuffer`;
 * `set(obj)` writes by field name.
 */
export interface StructuredView {
    arrayBuffer: ArrayBuffer;
    views: Record<string, Float32Array | Uint32Array | Int32Array>;
    set(values: Record<string, unknown>): void;
}

/**
 * webgpu-utils attribute arrays. Each entry is a typed array or a full
 * descriptor (mirrors webgpu-utils' `FullArraySpec`: `data` plus optional
 * `numComponents`, `type` (TypedArray constructor), `normalize`, `stride`,
 * `offset`).
 */
export interface GeometryArraySpec {
    data: ArrayLike<number> | number;
    numComponents?: number;
    type?: any;
    normalize?: boolean;
    stride?: number;
    offset?: number;
}
export type GeometryData = Record<string, ArrayLike<number> | GeometryArraySpec>;
