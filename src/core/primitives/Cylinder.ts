import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface CylinderOptions {
    /** Radius of the cylinder. @default 1 */
    radius?: number;
    /** Height of the cylinder. @default 1 */
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
 * Cylinder geometry. Wraps webgpu-utils createCylinderVertices.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Cylinder extends Geometry {
    parameters: Omit<CylinderOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: CylinderOptions = {}) {
        super(gpu, { data: primitives.createCylinderVertices(opts) as any, instancedData, interleave });
        this.parameters = opts;
    }
}
