import type { GPU } from '@/types';

export interface StorageBufferOptions {
    label?: string;
    size?: number | null;
    usage?: number;
}

export interface UniformBufferOptions {
    label?: string;
    size?: number | null;
    usage?: number;
}

export interface BufferOptions {
    label?: string;
    size?: number | null;
    usage?: number;
}

export const createStorageBuffer = (gpu: GPU, { label = 'storage buffer', size = null, usage = GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC }: StorageBufferOptions = {}): GPUBuffer => {
    usage |= GPUBufferUsage.STORAGE;

    return gpu.device.createBuffer({
        label,
        size: size!,
        usage,
    });
};

export const createUniformBuffer = (gpu: GPU, { label = 'uniform buffer', size = null, usage = GPUBufferUsage.COPY_DST }: UniformBufferOptions = {}): GPUBuffer => {
    usage |= GPUBufferUsage.UNIFORM;
    return gpu.device.createBuffer({
        label,
        size: size!,
        usage,
    });
};

export const createBuffer = (gpu: GPU, { label = 'buffer', size = null, usage = GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC }: BufferOptions = {}): GPUBuffer => {
    return gpu.device.createBuffer({
        label,
        size: size!,
        usage,
    });
};
