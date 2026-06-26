import { createUniformBuffer } from 'ogpu';
import { makeStructuredView } from 'webgpu-utils';
import type { GPU, StructuredView } from '@/types';

// Build a standalone single-struct uniform with its own GPU buffer from a
// pipeline's reflected struct def (e.g. `pipeline.defs.uniforms.scaleUniform`).
// Returns a `gui.uniform`-compatible target ({ uniforms, uniformBuffer, gpu })
// with a `set(values)` that updates the view and uploads it.
export interface UniformStructTarget {
    uniforms: StructuredView;
    uniformBuffer: GPUBuffer;
    gpu: GPU;
    set(next: Record<string, unknown>): void;
}

export function makeUniformStruct(gpu: GPU, def: any, values: Record<string, unknown>, label: string): UniformStructTarget {
    const uniforms = makeStructuredView(def);
    const uniformBuffer = createUniformBuffer(gpu, { label, size: uniforms.arrayBuffer.byteLength });
    const target: UniformStructTarget = {
        uniforms,
        uniformBuffer,
        gpu,
        set(next: Record<string, unknown>) {
            uniforms.set(next);
            gpu.device.queue.writeBuffer(uniformBuffer, 0, uniforms.arrayBuffer);
        },
    };
    target.set(values);
    return target;
}
