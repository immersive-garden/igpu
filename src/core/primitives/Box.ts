import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface BoxOptions {
    /** Edge length of the cube. @default 1 */
    size?: number;
    /** Per-instance attribute arrays (Geometry passthrough). */
    instancedData?: GeometryData;
    /** Interleave instanced buffers (Geometry passthrough). @default false */
    interleave?: boolean;
}

/**
 * Box geometry. Wraps webgpu-utils createCubeVertices.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Box extends Geometry {
    parameters: Omit<BoxOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: BoxOptions = {}) {
        super(gpu, { data: primitives.createCubeVertices(opts) as any, instancedData, interleave });
        this.parameters = opts; // resolved shape options, for introspection
    }
}
