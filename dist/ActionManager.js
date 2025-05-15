/**
 * Zarzadza historią akcji (undo/redo)
 */
export class ActionManager {
    constructor() {
        this.undoStack = []; // stos undo
        this.redoStack = []; // stos redo
        this.maxHistorySize = 50; // max rozmiar historii
    }
    /**
     * Cofnij akcje
     */
    undo() {
        if (this.undoStack.length > 0) {
            const action = this.undoStack.pop();
            action.undo();
            this.redoStack.push(action);
        }
    }
    /**
     * Ponow akcje
     */
    redo() {
        if (this.redoStack.length > 0) {
            const action = this.redoStack.pop();
            action.execute();
            this.undoStack.push(action);
        }
    }
    /**
     * Dodaj akcje do historii
     */
    recordAction(action) {
        this.undoStack.push(action);
        this.redoStack = [];
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }
    /**
     * Czy można cofnąć
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
    /**
     * Czy można ponowić
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    /**
     * Czyści historię
     */
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
    }
}
