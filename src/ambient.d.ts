// Engine runtime globals bootstrapped at startup.
// - `ktx` / `createKtxReadModule`: the Khronos KTX reader loaded as a global
//   <script> in index.html and stashed on window by Renderer.initDevice.
// - `__reloadShader`: hot-reload hook installed by ShaderReload.
// (Vite `?raw` module declarations live in shaders.d.ts.)

declare global {
    interface Window {
        ktx?: any;
        createKtxReadModule?: (...args: any[]) => Promise<any>;
        __reloadShader?: (prev: string, next: string) => void;
    }

    var __reloadShader: ((prev: string, next: string) => void) | undefined;
}

export {};
