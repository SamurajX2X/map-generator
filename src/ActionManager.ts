import type { MapAction } from './actions.js';

/**
 * Zarzadza historią akcji (undo/redo)
 */
export class ActionManager {
    private undoStack: MapAction[] = []; // stos undo
    private redoStack: MapAction[] = []; // stos redo
    private readonly maxHistorySize: number = 50; // max rozmiar historii

    /**
     * Cofnij akcje
     */
    public undo(): void {
        if (this.undoStack.length > 0) {
            const action = this.undoStack.pop()!;
            action.undo();
            this.redoStack.push(action);
        }
    }

    /**
     * Ponow akcje
     */
    public redo(): void {
        if (this.redoStack.length > 0) {
            const action = this.redoStack.pop()!;
            action.execute();
            this.undoStack.push(action);
        }
    }

    /**
     * Dodaj akcje do historii
     */
    public recordAction(action: MapAction): void {
        this.undoStack.push(action);
        this.redoStack = [];
        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }

    /**
     * Czy można cofnąć
     */
    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    /**
     * Czy można ponowić
     */
    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    /**
     * Czyści historię
     */
    public clearHistory(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}
