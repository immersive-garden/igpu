import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface TorusOptions {
    /** Distance from the center of the tube to the center of the torus. @default 1 */
    radius?: number;
    /** Radius of the tube. @default 0.24 */
    thickness?: number;
    /** Number of subdivisions around the torus ring. @default 24 */
    radialSubdivisions?: number;
    /** Number of subdivisions around the tube cross-section. @default 12 */
    bodySubdivisions?: number;
    /** Start angle of the torus arc in radians. @default 0 */
    startAngle?: number;
    /** End angle of the torus arc in radians. @default Math.PI*2 */
    endAngle?: number;
    /** Per-instance attribute arrays (Geometry passthrough). */
    instancedData?: GeometryData;
    /** Interleave instanced buffers (Geometry passthrough). @default false */
    interleave?: boolean;
}

/**
 * Torus geometry. Wraps webgpu-utils createTorusVertices.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Torus extends Geometry {
    parameters: Omit<TorusOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: TorusOptions = {}) {
        super(gpu, { data: primitives.createTorusVertices(opts) as any, instancedData, interleave });
        this.parameters = opts; // resolved shape options, for introspection
    }
}
