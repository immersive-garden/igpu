import { Geometry } from '../Geometry.js';
import type { GPU, GeometryData } from '@/types';

export interface FullscreenTriangleOptions {
    /** Per-instance attribute arrays (Geometry passthrough). */
    instancedData?: GeometryData;
    /** @default false */
    interleave?: boolean;
}

// Single oversized triangle covering the whole clip-space viewport ([-1,3]²);
// the part outside [-1,1] is clipped away, leaving a gapless fullscreen surface
// in one draw — cheaper and seam-free vs a two-triangle quad. Standard trick for
// blit / post / fullscreen passes.
const POSITION = [-1, 3, 0, 3, -1, 0, -1, -1, 0];
// uv runs 0..1 across the visible screen (the >1 values fall in the clipped region).
const UV = [0, 2, 2, 0, 0, 0];

/**
 * Fullscreen covering-triangle geometry. Carries `position` (vec3) and `uv`
 * (vec2). Pair with a `cullMode: 'none'` pipeline; a shader that doesn't read
 * `uv` simply ignores it.
 * @param gpu OGPU gpu context (renderer.gpu)
 * @param opts
 */
export class FullscreenTriangle extends Geometry {
    constructor(gpu: GPU, { instancedData, interleave }: FullscreenTriangleOptions = {}) {
        super(gpu, {
            data: {
                position: { data: POSITION, numComponents: 3, type: Float32Array },
                uv: { data: UV, numComponents: 2, type: Float32Array },
            } as any, // `type` is not in GeometryData's descriptor shape; webgpu-utils accepts it
            instancedData,
            interleave,
        });
    }
}
