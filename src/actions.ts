import type { MapEditor } from './MapEditor.js';

export interface MapAction {
    execute(): void;
    undo(): void;
}

export class TextureAction implements MapAction {
    constructor(
        private editor: MapEditor,
        private x: number,
        private y: number,
        private newTexture: string,
        private oldTexture: string
    ) { }

    execute() {
        this.editor.placeTextureInternal(this.x, this.y, this.newTexture);
    }

    undo() {
        this.editor.placeTextureInternal(this.x, this.y, this.oldTexture);
    }
}

export class BatchAction implements MapAction {
    constructor(private actions: MapAction[]) { }

    execute() {
        for (const action of this.actions) {
            action.execute();
        }
    }

    undo() {
        for (let i = this.actions.length - 1; i >= 0; i--) {
            this.actions[i].undo();
        }
    }
}
