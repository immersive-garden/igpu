import { Pane } from 'tweakpane';

// Target for gui.uniform(): any object owning a structured uniform view + buffer.
// Matches Mesh and any pass that owns its own uniform buffer.
interface UniformTarget {
    uniforms: { views?: Record<string, ArrayLike<number>>; set(values: Record<string, unknown>): void; arrayBuffer: ArrayBuffer };
    uniformBuffer: GPUBuffer;
    gpu: { device: GPUDevice };
}

export interface GUIOptions {
    title?: string;
    expanded?: boolean;
    container?: HTMLElement;
    pane?: any;
}

/**
 * Thin wrapper around Tweakpane's `Pane`.
 *
 * Exposes the raw pane on `this.pane` for anything not covered here, plus a few
 * engine-aware helpers:
 *
 *   gui.add(obj, 'key', opts)            // bind a single property, returns the binding
 *   gui.uniform(pipeline, 'uScale', opts) // bind a shader uniform; writes + uploads on change
 *   gui.button('Label', () => {...})      // action button
 *   gui.folder('Title')                   // returns a sub-GUI scoped to a folder
 *   gui.monitor(obj, 'key', opts)         // read-only readout (e.g. fps)
 *
 * `opts` are passed straight through to Tweakpane (min/max/step/label/options/…).
 */
export class GUI {
    pane: any;
    _ownsPane: boolean;

    constructor({ title = 'OGPU', expanded = false, container, pane }: GUIOptions = {}) {
        // Allow nesting: a folder hands its FolderApi in as `pane`.
        this.pane = pane ?? new Pane({ title, expanded, container });
        this._ownsPane = !pane;
    }

    add(obj: object, key: string, opts: any = {}): any {
        return this.pane.addBinding(obj, key, opts);
    }

    monitor(obj: object, key: string, opts: any = {}): any {
        return this.pane.addBinding(obj, key, { readonly: true, ...opts });
    }

    button(title: string, onClick: () => void): any {
        const btn = this.pane.addButton({ title });
        btn.on('click', onClick);
        return btn;
    }

    folder(title: string, { expanded = true }: { expanded?: boolean } = {}): GUI {
        const folder = this.pane.addFolder({ title, expanded });
        return new GUI({ pane: folder });
    }

    /**
     * Bind a uniform on any object that owns a structured uniform view + buffer
     * (a `Mesh`, or a pass that owns its uniforms). Tweakpane edits a local proxy;
     * every change pushes the value through `target.uniforms.set` and writes the
     * buffer to the GPU. `target` must expose `.uniforms`, `.uniformBuffer`, `.gpu`.
     */
    uniform(target: UniformTarget, key: string, opts: any = {}): any {
        const view = target.uniforms.views?.[key];
        // Scalars are length-1 typed-array views → unwrap to a number; vecs stay arrays.
        let initial: any = 0;
        if (view != null) initial = view.length > 1 ? Array.from(view) : view[0];
        const proxy: Record<string, any> = { [key]: opts.value ?? initial };
        delete opts.value;

        const write = () => {
            target.uniforms.set({ [key]: proxy[key] });
            target.gpu.device.queue.writeBuffer(target.uniformBuffer, 0, target.uniforms.arrayBuffer);
        };

        const binding = this.pane.addBinding(proxy, key, opts);
        binding.on('change', () => write());
        // Apply once so the GPU matches the GUI's starting state.
        write();
        return binding;
    }

    dispose(): void {
        if (this._ownsPane) this.pane.dispose();
    }
}
