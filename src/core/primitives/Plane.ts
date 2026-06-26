import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface PlaneOptions {
    /** @default 1 */
    width?: number;
    /** @default 1 */
    depth?: number;
    /** @default 1 */
    subdivisionsWidth?: number;
    /** @default 1 */
    subdivisionsDepth?: number;
    /** (Geometry passthrough). */
    instancedData?: GeometryData;
    /** @default false */
    interleave?: boolean;
}

/**
 * Plane geometry (XZ plane). Wraps webgpu-utils createPlaneVertices.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class Plane extends Geometry {
    parameters: Omit<PlaneOptions, 'instancedData' | 'interleave'>;

    constructor(gpu: GPU, { instancedData, interleave, ...opts }: PlaneOptions = {}) {
        super(gpu, { data: primitives.createPlaneVertices(opts) as any, instancedData, interleave });
        this.parameters = opts;
    }
}
