import { primitives } from 'webgpu-utils';
import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface ThreeDFOptions {
    /** (Geometry passthrough). */
    instancedData?: GeometryData;
    /** @default false */
    interleave?: boolean;
}

/**
 * 3D "F" test geometry. Wraps webgpu-utils create3DFVertices (no shape options).
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class ThreeDF extends Geometry {
    constructor(gpu: GPU, { instancedData, interleave }: ThreeDFOptions = {}) {
        super(gpu, { data: primitives.create3DFVertices() as any, instancedData, interleave });
    }
}
