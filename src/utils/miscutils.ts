// Note: We disallow negative values as this is used for timestamp queries
// where it's possible for a query to return a beginning time greater than the
// end time. See: https://gpuweb.github.io/gpuweb/#timestamp
export class NonNegativeRollingAverage {
    #total: number = 0;
    #samples: number[] = [];
    #cursor: number = 0;
    #numSamples: number;
    constructor(numSamples: number = 30) {
        this.#numSamples = numSamples;
    }
    addSample(v: number): void {
        if (!Number.isNaN(v) && Number.isFinite(v) && v >= 0) {
            this.#total += v - (this.#samples[this.#cursor] || 0);
            this.#samples[this.#cursor] = v;
            this.#cursor = (this.#cursor + 1) % this.#numSamples;
        }
    }
    get(): number {
        return this.#total / this.#samples.length;
    }
}
