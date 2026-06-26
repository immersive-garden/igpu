import { makeShaderDataDefinitions, makeStructuredView, generateMipmap } from 'webgpu-utils';
import parseExr from 'parse-exr';
import { Texture } from '@core/Texture';
import { createUniformBuffer } from '../BufferUtils';
import { parseKTXHeader } from '../ktxutils';
import { loadJSON } from '../JSONLoader';
import type { GPU } from '@/types';

import ggx from './ggx.wgsl?raw';
import unpackOct from './unpackoct.wgsl?raw';
import unpackEquirect from './unpackequirect.wgsl?raw';

const EXR_FLOAT_TYPE = 1015;

const DEFAULT_FACE_SIZE = 256;
// Layer order matches WebGPU/D3D cube convention: +X, -X, +Y, -Y, +Z, -Z.
// Shader's cubeFaceDir() embeds the per-face basis.

export interface IBLOptions {
    url: string;
    faceSize?: number;
    mipLevels?: number | null;
    label?: string;
}

export interface IBLResult {
    texture: GPUTexture;
    view: GPUTextureView;
    mipLevels: number;
    faceSize: number;
}

interface CubeResult {
    texture: GPUTexture;
    view: GPUTextureView;
    faceSize: number;
}

export async function loadIBLCubeMap(gpu: GPU, { url, faceSize = DEFAULT_FACE_SIZE, mipLevels = null, label = 'IBL cube' }: IBLOptions): Promise<IBLResult> {
    if (!gpu) throw new Error('loadIBLCubeMap: no gpu context');
    if (!url) throw new Error('loadIBLCubeMap: no url provided');

    const lower = url.toLowerCase();
    const isOct = lower.includes('oct');
    const isKTX = lower.endsWith('.ktx') || lower.endsWith('.ktx2');
    const isHDR = lower.endsWith('.hdr');
    const isEXR = lower.endsWith('.exr');

    if (!isKTX && !isHDR && !isEXR) {
        throw new Error(`loadIBLCubeMap: unsupported url ${url}`);
    }

    const totalMips = mipLevels ?? Math.floor(Math.log2(faceSize)) + 1;

    let unpacked: CubeResult;
    if (isOct) {
        const sourceTexture = isKTX ? await loadOctahedralKTX(gpu, url) : await loadFloatImageTexture(gpu, url, `${label} oct source`);

        unpacked = unpackToCube(gpu, {
            sourceTexture,
            faceSize,
            label: `${label}-oct`,
            shader: unpackOct,
        });
    } else {
        const sourceTexture = await loadFloatImageTexture(gpu, url, `${label} equirect`);

        unpacked = unpackToCube(gpu, {
            sourceTexture,
            faceSize,
            label: `${label}-equirect`,
            shader: unpackEquirect,
        });
    }

    return prefilterCube(gpu, {
        sourceCube: unpacked.texture,
        faceSize,
        mipLevels: totalMips,
        label,
    });
}

async function loadFloatImageTexture(gpu: GPU, url: string, label: string): Promise<GPUTexture> {
    const lower = url.toLowerCase();
    const buf = await (await fetch(url)).arrayBuffer();

    let width: number;
    let height: number;
    let data: any;

    if (lower.endsWith('.hdr')) {
        ({ width, height, data } = parseRGBE(buf));
    } else if (lower.endsWith('.exr')) {
        ({ width, height, data } = parseExr(buf, EXR_FLOAT_TYPE));
    } else {
        throw new Error(`loadFloatImageTexture: unsupported url ${url}`);
    }

    return createEquirectTexture(gpu, { width, height, data, label });
}

export async function loadSphericalHarmonics(url: string): Promise<Float32Array> {
    if (!url) throw new Error('loadSphericalHarmonics: no url provided');

    const data = await loadJSON(url);
    const coeffs: Array<{ rgb: [number, number, number] }> = data.coefficients;

    // vec4-padded layout so the array is upload-ready for a std140-ish uniform/storage buffer
    const out = new Float32Array(coeffs.length * 4);
    coeffs.forEach((c, i) => {
        out[i * 4 + 0] = c.rgb[0];
        out[i * 4 + 1] = c.rgb[1];
        out[i * 4 + 2] = c.rgb[2];
        out[i * 4 + 3] = 0;
    });

    return out;
}

// ---- shared cube creation / dispatch ----

function createDestinationCube(gpu: GPU, { faceSize, mipLevels, label }: { faceSize: number; mipLevels: number; label: string }): GPUTexture {
    return gpu.device.createTexture({
        label: `${label}-dest-cube`,
        size: [faceSize, faceSize, 6],
        format: 'rgba16float',
        mipLevelCount: mipLevels,
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
    });
}

function makeFaceMipView(texture: GPUTexture, face: number, mip: number): GPUTextureView {
    return texture.createView({
        dimension: '2d',
        baseArrayLayer: face,
        arrayLayerCount: 1,
        baseMipLevel: mip,
        mipLevelCount: 1,
    });
}

function unpackToCube(gpu: GPU, { sourceTexture, faceSize, label, shader }: { sourceTexture: GPUTexture; faceSize: number; label: string; shader: string }): CubeResult {
    // Full mip chain: the GGX prefilter samples this cube at a mip chosen from the
    // sample's solid angle (ggx.wgsl), which kills the bright-dot/firefly artifacts.
    // That trick is inert without real mips, so build + generate them here.
    const mipLevels = Math.floor(Math.log2(faceSize)) + 1;
    const dest = createDestinationCube(gpu, { faceSize, mipLevels, label: `${label}-unpack` });

    const module = gpu.device.createShaderModule({ label: `${label}-unpack-module`, code: shader });
    const defs: any = makeShaderDataDefinitions(shader);
    const uniformsView: any = makeStructuredView(defs.uniforms.uniforms);

    const pipeline = gpu.device.createComputePipeline({
        label: `${label}-unpack-pipeline`,
        layout: 'auto',
        compute: { module, entryPoint: 'main' },
    });

    const sampler = gpu.device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
    });

    const sourceView = sourceTexture.createView({ dimension: '2d' });

    const encoder = gpu.device.createCommandEncoder({ label: `${label}-unpack-encoder` });
    const pass = encoder.beginComputePass({ label: `${label}-unpack-pass` });
    pass.setPipeline(pipeline);

    const uniformBuffers: GPUBuffer[] = [];

    for (let face = 0; face < 6; face++) {
        uniformsView.set({
            resolution: faceSize,
            faceIndex: face,
        });

        const uBuf = createUniformBuffer(gpu, {
            label: `${label}-unpack-uniforms-face-${face}`,
            size: uniformsView.arrayBuffer.byteLength,
        });
        gpu.device.queue.writeBuffer(uBuf, 0, uniformsView.arrayBuffer);
        uniformBuffers.push(uBuf);

        const bindGroup = gpu.device.createBindGroup({
            label: `${label}-unpack-bg-face-${face}`,
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: uBuf } },
                { binding: 1, resource: sourceView },
                { binding: 2, resource: makeFaceMipView(dest, face, 0) },
                { binding: 3, resource: sampler },
            ],
        });

        pass.setBindGroup(0, bindGroup);
        pass.dispatchWorkgroups(faceSize, faceSize, 1);
    }

    pass.end();
    gpu.device.queue.submit([encoder.finish()]);

    // Unpack only wrote mip 0; fill the rest so the prefilter's mip-based sampling works.
    generateMipmap(gpu.device, dest);

    return {
        texture: dest,
        view: dest.createView({ dimension: 'cube' }),
        faceSize,
    };
}

function prefilterCube(gpu: GPU, { sourceCube, faceSize, mipLevels, label }: { sourceCube: GPUTexture; faceSize: number; mipLevels: number; label: string }): IBLResult {
    const dest = createDestinationCube(gpu, { faceSize, mipLevels, label });

    const module = gpu.device.createShaderModule({ label: `${label}-ggx-module`, code: ggx });
    const defs: any = makeShaderDataDefinitions(ggx);
    const uniformsView: any = makeStructuredView(defs.uniforms.uniforms);

    const pipeline = gpu.device.createComputePipeline({
        label: `${label}-ggx-pipeline`,
        layout: 'auto',
        compute: { module, entryPoint: 'main' },
    });

    const sampler = gpu.device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        addressModeW: 'clamp-to-edge',
    });

    const sourceView = sourceCube.createView({ dimension: 'cube' });

    const encoder = gpu.device.createCommandEncoder({ label: `${label}-ggx-encoder` });
    const pass = encoder.beginComputePass({ label: `${label}-ggx-pass` });
    pass.setPipeline(pipeline);

    const uniformBuffers: GPUBuffer[] = [];

    for (let mip = 0; mip < mipLevels; mip++) {
        const mipSize = Math.max(1, faceSize >> mip);
        const roughness = mipLevels > 1 ? mip / (mipLevels - 1) : 0;

        for (let face = 0; face < 6; face++) {
            uniformsView.set({
                resolution: mipSize,
                sourceResolution: faceSize,
                roughness,
                mipLevel: mip,
                faceIndex: face,
            });

            const uBuf = createUniformBuffer(gpu, {
                label: `${label}-ggx-uniforms-mip-${mip}-face-${face}`,
                size: uniformsView.arrayBuffer.byteLength,
            });
            gpu.device.queue.writeBuffer(uBuf, 0, uniformsView.arrayBuffer);
            uniformBuffers.push(uBuf);

            const bindGroup = gpu.device.createBindGroup({
                label: `${label}-ggx-bg-mip-${mip}-face-${face}`,
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: uBuf } },
                    { binding: 1, resource: sourceView },
                    { binding: 2, resource: makeFaceMipView(dest, face, mip) },
                    { binding: 3, resource: sampler },
                ],
            });

            pass.setBindGroup(0, bindGroup);
            pass.dispatchWorkgroups(mipSize, mipSize, 1);
        }
    }

    pass.end();
    gpu.device.queue.submit([encoder.finish()]);

    // Source env cube was only an integration input. Its commands are already submitted,
    // so destroy now — the device keeps it alive until the GGX work finishes on the GPU.
    sourceCube.destroy();

    return {
        texture: dest,
        view: dest.createView({ dimension: 'cube' }),
        mipLevels,
        faceSize,
    };
}

// ---- source loaders ----

async function loadOctahedralKTX(gpu: GPU, url: string): Promise<GPUTexture> {
    const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
    const header = parseKTXHeader(buf);
    const ktxTexture: any = new (window.ktx as any).ktxTexture(buf);

    const mipData: any[] = [];
    for (let i = 0; i < header.levels; i++) {
        mipData.push(ktxTexture.getImage(i, 0, 0));
    }

    return new Texture(gpu, {
        width: header.width,
        height: header.height,
        depth: 1,
        data: mipData,
        format: header.format as GPUTextureFormat,
        dimension: '2d',
        label: 'oct-source',
        mipLevelCount: header.levels,
        generateMipmaps: header.levels > 1,
    }).texture!;
}

function createEquirectTexture(gpu: GPU, { width, height, data, label }: { width: number; height: number; data: any; label: string }): GPUTexture {
    const half = floatToHalfArray(data);

    return new Texture(gpu, {
        width,
        height,
        depth: 1,
        data: half,
        format: 'rgba16float',
        dimension: '2d',
        label,
    }).texture!;
}

// ---- Radiance HDR (RGBE) parser ----
// Decodes Greg Ward's Radiance .hdr format (RLE or flat) to RGBA Float32.
// Spec: https://radsite.lbl.gov/radiance/refer/filefmts.pdf

function parseRGBE(arrayBuffer: ArrayBuffer): { width: number; height: number; data: Float32Array } {
    const bytes = new Uint8Array(arrayBuffer);
    let pos = 0;

    const readLine = (): string => {
        let s = '';
        while (pos < bytes.length) {
            const c = bytes[pos++];
            if (c === 0x0a) break;
            s += String.fromCharCode(c);
        }
        return s;
    };

    const magic = readLine();
    if (!magic.startsWith('#?')) throw new Error('parseRGBE: not a Radiance file');

    // skip header lines until empty line
    while (readLine().length > 0) {}

    const res = readLine();
    const m = res.match(/^-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/);
    if (!m) throw new Error(`parseRGBE: unsupported orientation "${res}"`);

    const height = parseInt(m[1], 10);
    const width = parseInt(m[2], 10);

    const out = new Float32Array(width * height * 4);
    const scanline = new Uint8Array(width * 4);

    for (let y = 0; y < height; y++) {
        const useRLE = width >= 8 && width <= 0x7fff && bytes[pos] === 2 && bytes[pos + 1] === 2 && (bytes[pos + 2] & 0x80) === 0;

        if (useRLE) {
            // 4-byte scanline header
            const declaredLen = (bytes[pos + 2] << 8) | bytes[pos + 3];
            if (declaredLen !== width) throw new Error('parseRGBE: scanline width mismatch');
            pos += 4;

            for (let ch = 0; ch < 4; ch++) {
                let p = 0;
                while (p < width) {
                    const run = bytes[pos++];
                    if (run > 128) {
                        const count = run - 128;
                        const val = bytes[pos++];
                        for (let i = 0; i < count; i++) scanline[p++ * 4 + ch] = val;
                    } else {
                        for (let i = 0; i < run; i++) scanline[p++ * 4 + ch] = bytes[pos++];
                    }
                }
            }
        } else {
            // flat RGBE row
            for (let x = 0; x < width; x++) {
                scanline[x * 4 + 0] = bytes[pos++];
                scanline[x * 4 + 1] = bytes[pos++];
                scanline[x * 4 + 2] = bytes[pos++];
                scanline[x * 4 + 3] = bytes[pos++];
            }
        }

        // convert row from RGBE to float
        for (let x = 0; x < width; x++) {
            const off = (y * width + x) * 4;
            const r = scanline[x * 4 + 0];
            const g = scanline[x * 4 + 1];
            const b = scanline[x * 4 + 2];
            const e = scanline[x * 4 + 3];
            const scale = e === 0 ? 0 : Math.pow(2, e - 128) / 255;
            out[off + 0] = r * scale;
            out[off + 1] = g * scale;
            out[off + 2] = b * scale;
            out[off + 3] = 1;
        }
    }

    return { width, height, data: out };
}

// float32 -> float16 (IEEE 754 binary16) bit conversion
function floatToHalfArray(f32: Float32Array): Uint16Array {
    const out = new Uint16Array(f32.length);
    const buf = new ArrayBuffer(4);
    const fview = new Float32Array(buf);
    const uview = new Uint32Array(buf);

    for (let i = 0; i < f32.length; i++) {
        fview[0] = f32[i];
        const x = uview[0];

        const sign = (x >> 16) & 0x8000;
        let mant = (x >> 12) & 0x07ff;
        const exp = (x >> 23) & 0xff;

        if (exp >= 143) {
            // overflow / NaN / Inf
            out[i] = sign | 0x7c00 | (exp === 255 && x & 0x7fffff ? 1 : 0);
        } else if (exp >= 113) {
            // normal
            out[i] = sign | ((exp - 112) << 10) | (mant >> 1);
        } else if (exp >= 103) {
            // subnormal
            mant |= 0x0800;
            out[i] = sign | (mant >> (114 - exp));
        } else {
            // underflow -> zero
            out[i] = sign;
        }
    }

    return out;
}
