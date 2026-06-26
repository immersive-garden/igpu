import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface ConeOptions {
    /** Radius of the bottom circle. @default 1 */
    bottomRadius?: number;
    /** Radius of the top circle; 0 gives a pointed cone. @default 0 */
    topRadius?: number;
    /** Height of the cone. @default 1 */
    height?: number;
    /** Number of subdivisions around the circumference. @default 24 */
    radialSubdivisions?: number;
    /** Number of subdivisions along the height. @default 1 */
    verticalSubdivisions?: number;
    /** Whether to generate the top cap. @default true */
    topCap?: boolean;
    /** Whether to generate the bottom cap. @default true */
    bottomCap?: boolean;
    /** Per-instance attribute arrays (Geometry passthrough). */
    instancedData?: GeometryData;
    /** Interleave instanced buffers (Geometry passthrough). @default false */
    interleave?: boolean;
}

/**
 * (Truncated) cone geometry. Wraps webgpu-utils createTruncatedConeVertices.
 * Default topRadius=0 gives a pointed cone; set it >0 for a truncated cone.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Cone extends Geometry {
    parameters: Omit<ConeOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: ConeOptions = {}) {
        super(gpu, { data: primitives.createTruncatedConeVertices(opts) as any, instancedData, interleave });
        this.parameters = opts;
    }
}
