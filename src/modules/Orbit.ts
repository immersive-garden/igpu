// Based from ThreeJS' OrbitControls class, rewritten using es6 with some additions and subtractions.

import { Vec3, Vec2 } from '@math';
import type { Transform } from '@core/Transform';

export interface OrbitOptions {
    element?: HTMLElement | Document;
    enabled?: boolean;
    target?: ArrayLike<number>;
    ease?: number;
    inertia?: number;
    enableRotate?: boolean;
    rotateSpeed?: number;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    enableZoom?: boolean;
    zoomSpeed?: number;
    zoomStyle?: string;
    enablePan?: boolean;
    panSpeed?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    minAzimuthAngle?: number;
    maxAzimuthAngle?: number;
    minDistance?: number;
    maxDistance?: number;
}

/** Instance shape produced by `new Orbit(...)`. */
export interface OrbitInstance {
    enabled: boolean;
    target: Vec3;
    zoomStyle: string;
    minDistance: number;
    maxDistance: number;
    EPS: number;
    offset: Vec3;
    mouseButtons: { ORBIT: number; ZOOM: number; PAN: number };
    update(): void;
    forcePosition(): void;
    remove(): void;
}

const STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, DOLLY_PAN: 3 };
const tempVec3 = /* @__PURE__ */ new Vec3();
const tempVec2a = /* @__PURE__ */ new Vec2();
const tempVec2b = /* @__PURE__ */ new Vec2();

/** The orbit instance type — `Orbit` works as a type (`let o: Orbit`). */
export type Orbit = OrbitInstance;

/** Construct signature so `new Orbit(object, options)` type-checks. */
export interface OrbitConstructor {
    new (object: Transform, options?: OrbitOptions): OrbitInstance;
}

function OrbitImpl(
    this: OrbitInstance,
    object: Transform,
    {
        element = document,
        enabled = true,
        target = new Vec3(0, 0, 0),
        ease = 0.25,
        inertia = 0.85,
        enableRotate = true,
        rotateSpeed = 0.1,
        autoRotate = false,
        autoRotateSpeed = 1.0,
        enableZoom = true,
        zoomSpeed = 1,
        zoomStyle = 'dolly',
        enablePan = true,
        panSpeed = 0.1,
        minPolarAngle = 0,
        maxPolarAngle = Math.PI,
        minAzimuthAngle = -Infinity,
        maxAzimuthAngle = Infinity,
        minDistance = 0,
        maxDistance = Infinity,
    }: OrbitOptions = {}
) {
    this.enabled = enabled;
    // callers may pass a plain array (e.g. [0, 1, 0]); normalize to a Vec3 so
    // the chainable math works.
    this.target = new Vec3().copy(target);
    this.zoomStyle = zoomStyle;

    // Catch attempts to disable - set to 1 so has no effect
    ease = ease || 1;
    inertia = inertia || 0;

    this.minDistance = minDistance;
    this.maxDistance = maxDistance;
    this.EPS = 0.0001;

    // current position in sphericalTarget coordinates
    const sphericalDelta = { radius: 1, phi: 0, theta: 0 };
    const sphericalTarget = { radius: 1, phi: 0, theta: 0 };
    const spherical = { radius: 1, phi: 0, theta: 0 };
    const panDelta = new Vec3();

    // Grab initial position values
    const offset = new Vec3();
    offset.copy(object.position).sub(this.target);

    spherical.radius = sphericalTarget.radius = offset.len();
    spherical.theta = sphericalTarget.theta = Math.atan2(offset[0], offset[2]);
    spherical.phi = sphericalTarget.phi = Math.acos(Math.min(Math.max(offset[1] / sphericalTarget.radius, -1), 1));

    this.offset = offset;

    this.update = () => {
        if (autoRotate) {
            handleAutoRotate();
        }

        sphericalTarget.radius *= sphericalDelta.radius;
        sphericalTarget.theta += sphericalDelta.theta;
        sphericalTarget.phi += sphericalDelta.phi;

        sphericalTarget.theta = Math.max(minAzimuthAngle, Math.min(maxAzimuthAngle, sphericalTarget.theta));
        sphericalTarget.phi = Math.max(minPolarAngle + this.EPS, Math.min(maxPolarAngle - this.EPS, sphericalTarget.phi));
        sphericalTarget.radius = Math.max(this.minDistance, Math.min(this.maxDistance, sphericalTarget.radius));

        spherical.phi += (sphericalTarget.phi - spherical.phi) * ease;
        spherical.theta += (sphericalTarget.theta - spherical.theta) * ease;
        spherical.radius += (sphericalTarget.radius - spherical.radius) * ease;

        // apply pan to target. As offset is relative to target, it also shifts
        this.target.add(panDelta);

        const sinPhiRadius = spherical.radius * Math.sin(Math.max(0.000001, spherical.phi));
        offset[0] = sinPhiRadius * Math.sin(spherical.theta);
        offset[1] = spherical.radius * Math.cos(spherical.phi);
        offset[2] = sinPhiRadius * Math.cos(spherical.theta);

        object.position.copy(this.target).add(offset);
        object.lookAt(this.target);

        // Apply inertia to values
        sphericalDelta.theta *= inertia;
        sphericalDelta.phi *= inertia;
        panDelta.scale(inertia);

        // Reset scale every frame to avoid applying scale multiple times
        sphericalDelta.radius = 1;
    };

    // Updates internals with new position
    this.forcePosition = () => {
        offset.copy(object.position).sub(this.target);

        spherical.radius = sphericalTarget.radius = offset.len();
        spherical.theta = sphericalTarget.theta = Math.atan2(offset[0], offset[2]);
        spherical.phi = sphericalTarget.phi = Math.acos(Math.min(Math.max(offset[1] / sphericalTarget.radius, -1), 1));
        object.lookAt(this.target);
    };

    // Everything below here just updates panDelta and sphericalDelta
    // Using those two objects' values, the orbit is calculated

    const rotateStart = new Vec2();
    const panStart = new Vec2();
    const dollyStart = new Vec2();

    let state = STATE.NONE;
    this.mouseButtons = { ORBIT: 0, ZOOM: 1, PAN: 2 };

    function getZoomScale() {
        return Math.pow(0.95, zoomSpeed);
    }

    function panLeft(distance: number, m: ArrayLike<number>): void {
        tempVec3.set(m[0], m[1], m[2]).scale(-distance);
        panDelta.add(tempVec3);
    }

    function panUp(distance: number, m: ArrayLike<number>): void {
        tempVec3.set(m[4], m[5], m[6]).scale(distance);
        panDelta.add(tempVec3);
    }

    const pan = (deltaX: number, deltaY: number) => {
        const el = element === document ? document.body : (element as HTMLElement);
        tempVec3.copy(this.target).sub(object.position);
        let targetDistance = tempVec3.len();
        targetDistance *= Math.tan(((((object as any).fov || 45) / 2) * Math.PI) / 180.0);
        panLeft((2 * deltaX * targetDistance) / el.clientHeight, object.matrix);
        panUp((2 * deltaY * targetDistance) / el.clientHeight, object.matrix);
    };

    const dolly = (dollyScale: number) => {
        if (this.zoomStyle === 'dolly') sphericalDelta.radius /= dollyScale;
        else {
            // camera-specific fov/projection methods not on Transform base
            const cam = object as any;
            cam.fov /= dollyScale;
            if (cam.type === 'orthographic') cam.orthographic();
            else cam.perspective();
        }
    };

    function handleAutoRotate() {
        const angle = ((2 * Math.PI) / 60 / 60) * autoRotateSpeed;
        sphericalDelta.theta -= angle;
    }

    function handleMoveRotate(x: number, y: number): void {
        tempVec2a.set(x, y);
        tempVec2b.copy(tempVec2a).sub(rotateStart).scale(rotateSpeed);
        const el = element === document ? document.body : (element as HTMLElement);
        sphericalDelta.theta -= (2 * Math.PI * tempVec2b[0]) / el.clientHeight;
        sphericalDelta.phi -= (2 * Math.PI * tempVec2b[1]) / el.clientHeight;
        rotateStart.copy(tempVec2a);
    }

    function handleMouseMoveDolly(e: MouseEvent): void {
        tempVec2a.set(e.clientX, e.clientY);
        tempVec2b.copy(tempVec2a).sub(dollyStart);
        if (tempVec2b[1] > 0) {
            dolly(getZoomScale());
        } else if (tempVec2b[1] < 0) {
            dolly(1 / getZoomScale());
        }
        dollyStart.copy(tempVec2a);
    }

    function handleMovePan(x: number, y: number): void {
        tempVec2a.set(x, y);
        tempVec2b.copy(tempVec2a).sub(panStart).scale(panSpeed);
        pan(tempVec2b[0], tempVec2b[1]);
        panStart.copy(tempVec2a);
    }

    function handleTouchStartDollyPan(e: TouchEvent): void {
        if (enableZoom) {
            const dx = e.touches[0].pageX - e.touches[1].pageX;
            const dy = e.touches[0].pageY - e.touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            dollyStart.set(0, distance);
        }

        if (enablePan) {
            const x = 0.5 * (e.touches[0].pageX + e.touches[1].pageX);
            const y = 0.5 * (e.touches[0].pageY + e.touches[1].pageY);
            panStart.set(x, y);
        }
    }

    function handleTouchMoveDollyPan(e: TouchEvent): void {
        if (enableZoom) {
            const dx = e.touches[0].pageX - e.touches[1].pageX;
            const dy = e.touches[0].pageY - e.touches[1].pageY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            tempVec2a.set(0, distance);
            tempVec2b.set(0, Math.pow(tempVec2a[1] / dollyStart[1], zoomSpeed));
            dolly(tempVec2b[1]);
            dollyStart.copy(tempVec2a);
        }

        if (enablePan) {
            const x = 0.5 * (e.touches[0].pageX + e.touches[1].pageX);
            const y = 0.5 * (e.touches[0].pageY + e.touches[1].pageY);
            handleMovePan(x, y);
        }
    }

    const onMouseDown = (e: MouseEvent) => {
        if (!this.enabled) return;

        switch (e.button) {
            case this.mouseButtons.ORBIT:
                if (enableRotate === false) return;
                rotateStart.set(e.clientX, e.clientY);
                state = STATE.ROTATE;
                break;
            case this.mouseButtons.ZOOM:
                if (enableZoom === false) return;
                dollyStart.set(e.clientX, e.clientY);
                state = STATE.DOLLY;
                break;
            case this.mouseButtons.PAN:
                if (enablePan === false) return;
                panStart.set(e.clientX, e.clientY);
                state = STATE.PAN;
                break;
        }

        if (state !== STATE.NONE) {
            window.addEventListener('mousemove', onMouseMove, false);
            window.addEventListener('mouseup', onMouseUp, false);
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!this.enabled) return;

        switch (state) {
            case STATE.ROTATE:
                if (enableRotate === false) return;
                handleMoveRotate(e.clientX, e.clientY);
                break;
            case STATE.DOLLY:
                if (enableZoom === false) return;
                handleMouseMoveDolly(e);
                break;
            case STATE.PAN:
                if (enablePan === false) return;
                handleMovePan(e.clientX, e.clientY);
                break;
        }
    };

    const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove, false);
        window.removeEventListener('mouseup', onMouseUp, false);
        state = STATE.NONE;
    };

    const onMouseWheel = (e: WheelEvent) => {
        if (!this.enabled || !enableZoom || (state !== STATE.NONE && state !== STATE.ROTATE)) return;
        e.stopPropagation();
        e.preventDefault();

        if (e.deltaY < 0) {
            dolly(1 / getZoomScale());
        } else if (e.deltaY > 0) {
            dolly(getZoomScale());
        }
    };

    const onTouchStart = (e: TouchEvent) => {
        if (!this.enabled) return;
        e.preventDefault();

        switch (e.touches.length) {
            case 1:
                if (enableRotate === false) return;
                rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
                state = STATE.ROTATE;
                break;
            case 2:
                if (enableZoom === false && enablePan === false) return;
                handleTouchStartDollyPan(e);
                state = STATE.DOLLY_PAN;
                break;
            default:
                state = STATE.NONE;
        }
    };

    const onTouchMove = (e: TouchEvent) => {
        if (!this.enabled) return;
        e.preventDefault();
        e.stopPropagation();

        switch (e.touches.length) {
            case 1:
                if (enableRotate === false) return;
                handleMoveRotate(e.touches[0].pageX, e.touches[0].pageY);
                break;
            case 2:
                if (enableZoom === false && enablePan === false) return;
                handleTouchMoveDollyPan(e);
                break;
            default:
                state = STATE.NONE;
        }
    };

    const onTouchEnd = () => {
        if (!this.enabled) return;
        state = STATE.NONE;
    };

    const onContextMenu = (e: Event) => {
        if (!this.enabled) return;
        e.preventDefault();
    };

    function addHandlers() {
        element.addEventListener('contextmenu', onContextMenu, false);
        element.addEventListener('mousedown', onMouseDown as EventListener, false);
        element.addEventListener('wheel', onMouseWheel as EventListener, { passive: false });
        element.addEventListener('touchstart', onTouchStart as EventListener, { passive: false });
        element.addEventListener('touchend', onTouchEnd, false);
        element.addEventListener('touchmove', onTouchMove as EventListener, { passive: false });
    }

    this.remove = function () {
        element.removeEventListener('contextmenu', onContextMenu);
        element.removeEventListener('mousedown', onMouseDown as EventListener);
        element.removeEventListener('wheel', onMouseWheel as EventListener);
        element.removeEventListener('touchstart', onTouchStart as EventListener);
        element.removeEventListener('touchend', onTouchEnd);
        element.removeEventListener('touchmove', onTouchMove as EventListener);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    addHandlers();
}

/** `Orbit` value: the impl typed as a constructor (`new Orbit(...)`). */
export const Orbit = OrbitImpl as unknown as OrbitConstructor;
