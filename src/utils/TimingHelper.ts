function assert(cond: unknown, msg: string = ''): asserts cond {
    if (!cond) {
        throw new Error(msg);
    }
}

// We track command buffers so we can generate an error if
// we try to read the result before the command buffer has been executed.
const s_unsubmittedCommandBuffer = new Set<GPUCommandBuffer>();

if (typeof GPUQueue !== 'undefined') {
    GPUQueue.prototype.submit = (function (origFn: GPUQueue['submit']) {
        return function (this: GPUQueue, commandBuffers: Iterable<GPUCommandBuffer>) {
            origFn.call(this, commandBuffers);
            (commandBuffers as GPUCommandBuffer[]).forEach((cb) => s_unsubmittedCommandBuffer.delete(cb));
        };
    })(GPUQueue.prototype.submit);
}

// See https://webgpufundamentals.org/webgpu/lessons/webgpu-timing.html
export class TimingHelper {
    #canTimestamp: boolean;
    #device: GPUDevice;
    #querySet!: GPUQuerySet;
    #resolveBuffer!: GPUBuffer;
    #resultBuffer!: GPUBuffer;
    #commandBuffer: GPUCommandBuffer | undefined;
    #resultBuffers: GPUBuffer[] = [];
    // state can be 'free', 'need resolve', 'wait for result'
    #state: string = 'free';

    constructor(device: GPUDevice) {
        this.#device = device;
        this.#canTimestamp = device.features.has('timestamp-query');
        if (this.#canTimestamp) {
            this.#querySet = device.createQuerySet({
                type: 'timestamp',
                count: 2,
            });
            this.#resolveBuffer = device.createBuffer({
                size: this.#querySet.count * 8,
                usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
            });
        }
    }

    #beginTimestampPass(encoder: GPUCommandEncoder, fnName: 'beginRenderPass' | 'beginComputePass', descriptor: any): any {
        if (this.#canTimestamp) {
            assert(this.#state === 'free', 'state not free');
            this.#state = 'need resolve';

            const pass = (encoder as any)[fnName]({
                ...descriptor,
                ...{
                    timestampWrites: {
                        querySet: this.#querySet,
                        beginningOfPassWriteIndex: 0,
                        endOfPassWriteIndex: 1,
                    },
                },
            });

            const resolve = () => this.#resolveTiming(encoder);
            const trackCommandBuffer = (cb: GPUCommandBuffer) => this.#trackCommandBuffer(cb);
            pass.end = (function (origFn: () => void) {
                return function (this: any) {
                    origFn.call(this);
                    resolve();
                };
            })(pass.end);

            encoder.finish = (function (origFn: () => GPUCommandBuffer) {
                return function (this: any) {
                    const cb = origFn.call(this);
                    trackCommandBuffer(cb);
                    return cb;
                };
            })(encoder.finish.bind(encoder));

            return pass;
        } else {
            return (encoder as any)[fnName](descriptor);
        }
    }

    beginRenderPass(encoder: GPUCommandEncoder, descriptor: GPURenderPassDescriptor = {} as GPURenderPassDescriptor): GPURenderPassEncoder {
        return this.#beginTimestampPass(encoder, 'beginRenderPass', descriptor);
    }

    beginComputePass(encoder: GPUCommandEncoder, descriptor: GPUComputePassDescriptor = {}): GPUComputePassEncoder {
        return this.#beginTimestampPass(encoder, 'beginComputePass', descriptor);
    }

    #trackCommandBuffer(cb: GPUCommandBuffer): void {
        if (!this.#canTimestamp) {
            return;
        }
        assert(this.#state === 'need finish', 'you must call encoder.finish');
        this.#commandBuffer = cb;
        s_unsubmittedCommandBuffer.add(cb);
        this.#state = 'wait for result';
    }

    #resolveTiming(encoder: GPUCommandEncoder): void {
        if (!this.#canTimestamp) {
            return;
        }
        assert(this.#state === 'need resolve', 'you must use timerHelper.beginComputePass or timerHelper.beginRenderPass');
        this.#state = 'need finish';

        this.#resultBuffer =
            this.#resultBuffers.pop() ||
            this.#device.createBuffer({
                size: this.#resolveBuffer.size,
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
            });

        encoder.resolveQuerySet(this.#querySet, 0, this.#querySet.count, this.#resolveBuffer, 0);
        encoder.copyBufferToBuffer(this.#resolveBuffer, 0, this.#resultBuffer, 0, this.#resultBuffer.size);
    }

    async getResult(): Promise<number> {
        if (!this.#canTimestamp) {
            return 0;
        }
        assert(this.#state === 'wait for result', 'you must call encoder.finish and submit the command buffer before you can read the result');
        assert(!!this.#commandBuffer); // internal check
        assert(!s_unsubmittedCommandBuffer.has(this.#commandBuffer!), 'you must submit the command buffer before you can read the result');
        this.#commandBuffer = undefined;
        this.#state = 'free';

        const resultBuffer = this.#resultBuffer;
        await resultBuffer.mapAsync(GPUMapMode.READ);
        const times = new BigInt64Array(resultBuffer.getMappedRange());
        const duration = Number(times[1] - times[0]);
        resultBuffer.unmap();
        this.#resultBuffers.push(resultBuffer);
        return duration;
    }
}
