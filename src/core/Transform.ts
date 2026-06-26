import { Vec3, Quat, Mat4, Euler } from '@math';

const _aim = /* @__PURE__ */ new Mat4();

// Scene-graph node: local TRS + matrix/worldMatrix, parent/children. Base of everything renderable.
export class Transform {
    parent: Transform | null;
    children: Transform[];
    visible: boolean;
    label?: string;

    matrix: Mat4;
    worldMatrix: Mat4;

    matrixAutoUpdate: boolean;
    worldMatrixNeedsUpdate: boolean;

    position: Vec3;
    quaternion: Quat;
    rotation: Euler;
    scale: Vec3;
    up: Vec3;

    constructor() {
        this.parent = null;
        this.children = [];
        this.visible = true;

        this.matrix = new Mat4();
        this.worldMatrix = new Mat4();

        this.matrixAutoUpdate = true;
        this.worldMatrixNeedsUpdate = false;

        this.position = new Vec3(0, 0, 0);
        this.quaternion = new Quat(0, 0, 0, 1);
        this.scale = new Vec3(1, 1, 1);
        this.up = new Vec3(0, 1, 0);

        // Two-way Euler proxy: set `rotation.x/y/z` and the quaternion
        // follows; mutate the quaternion (lookAt, animation, rotateX…) and
        // `rotation` follows. The cross-sync setters don't re-fire, so no loop.
        this.rotation = new Euler();
        this.rotation.onChange = () => this.quaternion.setFromEuler(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.order.toLowerCase());
        this.quaternion.onChange = () => this.rotation.setFromQuaternion(this.quaternion);
    }

    setParent(parent: Transform | null, notifyParent = true): void {
        if (this.parent && parent !== this.parent) this.parent.removeChild(this, false);
        this.parent = parent;
        if (notifyParent && parent) parent.addChild(this, false);
    }

    addChild(child: Transform, notifyChild = true): void {
        if (!~this.children.indexOf(child)) this.children.push(child);
        if (notifyChild) child.setParent(this, false);
    }

    removeChild(child: Transform, notifyChild = true): void {
        if (~this.children.indexOf(child)) this.children.splice(this.children.indexOf(child), 1);
        if (notifyChild) child.setParent(null, false);
    }

    updateMatrixWorld(force?: boolean): void {
        if (this.matrixAutoUpdate) this.updateMatrix();
        if (this.worldMatrixNeedsUpdate || force) {
            if (this.parent === null) this.worldMatrix.copy(this.matrix);
            else this.worldMatrix.copy(this.parent.worldMatrix).multiply(this.matrix);
            this.worldMatrixNeedsUpdate = false;
            force = true;
        }

        for (let i = 0, l = this.children.length; i < l; i++) {
            this.children[i].updateMatrixWorld(force);
        }
    }

    updateMatrix(): void {
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.worldMatrixNeedsUpdate = true;
    }

    traverse(callback: (node: Transform) => boolean | void): void {
        // Return true in callback to stop traversing children
        if (callback(this)) return;
        for (let i = 0, l = this.children.length; i < l; i++) {
            this.children[i].traverse(callback);
        }
    }

    // Aim +Z at `target`. invert=true swaps eye/target (point `this` AT target).
    lookAt(target: ArrayLike<number>, invert?: boolean): void {
        if (invert) {
            this.quaternion.setFromRotationMatrix(_aim.aim(target, this.position, this.up));
        } else {
            this.quaternion.setFromRotationMatrix(_aim.aim(this.position, target, this.up));
        }
    }

    // Decompose this node's local `matrix` back into position / quaternion /
    // scale (the quaternion's onChange keeps `rotation` in sync).
    decompose(): this {
        this.matrix.decompose(this.position, this.quaternion, this.scale);
        // decompose writes the quaternion buffer in place (no Quat method), so
        // fire the sync manually to refresh `rotation`.
        this.quaternion.onChange();
        return this;
    }

    setRotation(quaternion: Quat): void {
        this.quaternion.copy(quaternion);
    }

    rotateX(angle: number): void {
        this.quaternion.rotateX(angle);
    }

    rotateY(angle: number): void {
        this.quaternion.rotateY(angle);
    }

    rotateZ(angle: number): void {
        this.quaternion.rotateZ(angle);
    }

    getEuler(out: Euler = new Euler()): Euler {
        return out.setFromQuaternion(this.quaternion, 'YXZ');
    }
}
