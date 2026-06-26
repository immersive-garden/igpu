import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface QuadOptions {
    /** Quad size. @default 2 */
    size?: number;
    /** @default 0 */
    xOffset?: number;
    /** @default 0 */
    yOffset?: number;
    /** Per-instance attribute arrays (Geometry passthrough). */
    instancedData?: GeometryData;
    /** @default false */
    interleave?: boolean;
}

/**
 * XY quad geometry (screen-space / billboard). Wraps webgpu-utils createXYQuadVertices.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Quad extends Geometry {
    parameters: Omit<QuadOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: QuadOptions = {}) {
        super(gpu, { data: primitives.createXYQuadVertices(opts) as any, instancedData, interleave });
        this.parameters = opts;
    }
}
