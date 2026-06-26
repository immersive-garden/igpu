import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface DiscOptions {
    /** Outer radius of the disc. @default 1 */
    radius?: number;
    /** Number of radial subdivisions around the disc. @default 24 */
    divisions?: number;
    /** Number of concentric ring subdivisions between innerRadius and radius. @default 1 */
    stacks?: number;
    /** Inner radius of the disc; 0 produces a solid disc, > 0 a ring. @default 0 */
    innerRadius?: number;
    /** Power applied to stack spacing; values > 1 push rings toward the outer edge, < 1 toward the center. @default 1 */
    stackPower?: number;
    /** Instanced attribute arrays passed through to Geometry. */
    instancedData?: GeometryData;
    /** Whether instanced buffers are interleaved; passed through to Geometry. @default false */
    interleave?: boolean;
}

/**
 * Disc geometry (flat ring/disc). Wraps webgpu-utils createDiscVertices.
 * @param gpu - OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Disc extends Geometry {
    parameters: Omit<DiscOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: DiscOptions = {}) {
        super(gpu, { data: primitives.createDiscVertices(opts) as any, instancedData, interleave });
        this.parameters = opts;
    }
}
