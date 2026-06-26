import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface SphereOptions {
    /** Radius of the sphere. @default 1 */
    radius?: number;
    /** Number of subdivisions around the equator. @default 24 */
    subdivisionsAxis?: number;
    /** Number of subdivisions from pole to pole. @default 12 */
    subdivisionsHeight?: number;
    /** Latitude at which to start generating vertices (0 = south pole). @default 0 */
    startLatitudeInRadians?: number;
    /** Latitude at which to stop generating vertices (Math.PI = north pole). @default Math.PI */
    endLatitudeInRadians?: number;
    /** Longitude at which to start generating vertices. @default 0 */
    startLongitudeInRadians?: number;
    /** Longitude at which to stop generating vertices. @default Math.PI*2 */
    endLongitudeInRadians?: number;
    /** Per-instance attribute arrays (Geometry passthrough). */
    instancedData?: GeometryData;
    /** Interleave instanced buffers (Geometry passthrough). @default false */
    interleave?: boolean;
}

/**
 * Sphere geometry. Wraps webgpu-utils createSphereVertices.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Sphere extends Geometry {
    parameters: Omit<SphereOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: SphereOptions = {}) {
        super(gpu, { data: primitives.createSphereVertices(opts) as any, instancedData, interleave });
        this.parameters = opts; // resolved shape options
    }
}
