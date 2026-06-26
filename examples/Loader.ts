// Default boot overlay for the examples. Subscribes to a Renderer's boot
// lifecycle and drives the #ogpu-loader markup (ring fill + fade-out) in
// index.html. All the DOM lives here, not in the engine — bring your own loader
// by registering the same two hooks (addBootProgressHandler /
// addBootCompleteHandler) against a different element.
import type { Renderer } from '@core/Renderer';

interface LoaderOptions {
    el?: string | Element;
}

export class Loader {
    el: Element | null;
    ring: Element | null | undefined;
    private _hidden: boolean = false;
    private _offProgress: (() => void) | undefined;
    private _offComplete: (() => void) | undefined;

    constructor(renderer: Renderer, { el = '#ogpu-loader' }: LoaderOptions = {}) {
        this.el = typeof el === 'string' ? document.querySelector(el) : el;
        if (!this.el) return;
        this.ring = this.el.querySelector('.ogpu-loader__ring');

        this._offProgress = renderer.addBootProgressHandler((pct: number) => {
            (this.ring as HTMLElement)?.style.setProperty('--p', String(pct));
        });
        this._offComplete = renderer.addBootCompleteHandler(() => this._hide());
    }

    _hide() {
        if (this._hidden) return;
        this._hidden = true;
        this._offProgress?.();
        this._offComplete?.();

        const el = this.el as HTMLElement;
        el.classList.add('is-hidden');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        // Fallback removal if the transition never fires.
        setTimeout(() => el.remove(), 600);
    }
}
