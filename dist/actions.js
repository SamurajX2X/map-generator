export class TextureAction {
    constructor(editor, x, y, newTexture, oldTexture) {
        this.editor = editor;
        this.x = x;
        this.y = y;
        this.newTexture = newTexture;
        this.oldTexture = oldTexture;
    }
    execute() {
        this.editor.placeTextureInternal(this.x, this.y, this.newTexture);
    }
    undo() {
        this.editor.placeTextureInternal(this.x, this.y, this.oldTexture);
    }
}
export class BatchAction {
    constructor(actions) {
        this.actions = actions;
    }
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
