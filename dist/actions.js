/**
 * Akcja zmiany tekstury na mapie
 */
export class TextureAction {
    constructor(editor, // edytor mapy
    x, // x
    y, // y
    newTexture, // nowa tekstura
    oldTexture // stara tekstura
    ) {
        this.editor = editor;
        this.x = x;
        this.y = y;
        this.newTexture = newTexture;
        this.oldTexture = oldTexture;
    }
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
export class BatchAction {
    constructor(actions) {
        this.actions = actions;
    }
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
