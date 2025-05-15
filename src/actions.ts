import type { MapEditor } from './MapEditor.js'

/**
 * Akcja na mapie (interfejs)
 */
export interface MapAction {
    execute(): void;
    undo(): void;
}

/**git add.
 *  zmiana tekstury na mapie
 */
export class TextureAction implements MapAction {
    constructor(
        private editor: MapEditor, // edytor mapy
        private x: number, // x
        private y: number, // y
        private newTexture: string, // nowa tekstura
        private oldTexture: string // stara tekstura
    ) { }
    /**
     * Wykonuje akcje
     */
    execute() {
        this.editor.placeTextureInternal(this.x, this.y, this.newTexture);
    }
    /**
     * Cofnij akcje
     */
    undo() {
        this.editor.placeTextureInternal(this.x, this.y, this.oldTexture);
    }
}

/**
 * Akcja grupowa (batch)
 */
export class BatchAction implements MapAction {
    constructor(private actions: MapAction[]) { }
    /**
     * Wykonuje wszystkie akcje
     */
    execute() {
        for (const action of this.actions) {
            action.execute();
        }
    }
    /**
     * Cofnij wszystkie akcje
     */
    undo() {
        for (let i = this.actions.length - 1; i >= 0; i--) {
            this.actions[i].undo();
        }
    }
}
