export class ActionManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;
    }
    undo() {
        if (this.undoStack.length > 0) {
            const action = this.undoStack.pop();
            action.undo();
            this.redoStack.push(action);
            console.log("Undo performed, stack size:", this.undoStack.length);
        }
    }
    redo() {
        if (this.redoStack.length > 0) {
            const action = this.redoStack.pop();
            action.execute();
            this.undoStack.push(action);
            console.log("Redo performed, stack size:", this.redoStack.length);
        }
    }
    recordAction(action) {
        this.undoStack.push(action);
        this.redoStack = [];
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }
    canUndo() {
        return this.undoStack.length > 0;
    }
    canRedo() {
        return this.redoStack.length > 0;
    }
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
    }
}
