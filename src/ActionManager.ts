import type { MapAction } from './actions.js';

export class ActionManager {
    private undoStack: MapAction[] = [];
    private redoStack: MapAction[] = [];
    private readonly maxHistorySize: number = 50;

    public undo(): void {
        if (this.undoStack.length > 0) {
            const action = this.undoStack.pop()!;
            action.undo();
            this.redoStack.push(action);
        }
    }

    public redo(): void {
        if (this.redoStack.length > 0) {
            const action = this.redoStack.pop()!;
            action.execute();
            this.undoStack.push(action);
        }
    }

    public recordAction(action: MapAction): void {
        this.undoStack.push(action);
        this.redoStack = [];

        if (this.undoStack.length > this.maxHistorySize) {
            this.undoStack.shift();
        }
    }

    public canUndo(): boolean {
        return this.undoStack.length > 0;
    }

    public canRedo(): boolean {
        return this.redoStack.length > 0;
    }

    public clearHistory(): void {
        this.undoStack = [];
        this.redoStack = [];
    }
}
