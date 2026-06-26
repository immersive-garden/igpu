export interface ExposedPromise<T = void> extends Promise<T> {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}

export const getPromise = <T = void>(): ExposedPromise<T> => {
    let _resolve!: (value: T | PromiseLike<T>) => void;
    let _reject!: (reason?: any) => void;
    const promise = new Promise<T>((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
    }) as ExposedPromise<T>;

    promise.resolve = _resolve;
    promise.reject = _reject;

    return promise;
};
