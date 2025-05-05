import type { MapEditor } from './MapEditor.js';

export class InputHandler {
    private isDragging: boolean = false;
    private selectionOverlay: HTMLDivElement | null = null;
    private dragStartClientX: number = 0;
    private dragStartClientY: number = 0;
    private dragHighlightedBlocks: Set<string> = new Set();

    private boundMouseMove: (e: MouseEvent) => void;
    private boundMouseUp: (e: MouseEvent) => void;

    constructor(
        private canvas: HTMLCanvasElement,
        private editor: MapEditor,
        private tileSize: number
    ) {
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);
        this.bindEvents();
    }

    public updateTileSize(newTileSize: number): void {
        this.tileSize = newTileSize;
    }

    private bindEvents(): void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));

        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('mapEditorContextMenu');
            if (contextMenu && !contextMenu.contains(e.target as Node)) {
                contextMenu.style.display = 'none';
            }
        });
    }

    private isCtrlOrMeta(e: MouseEvent | KeyboardEvent): boolean {
        return e.ctrlKey || e.metaKey;
    }

    private getGridCoordinates(clientX: number, clientY: number): { gridX: number, gridY: number } | null {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (x < 0 || x >= this.canvas.width || y < 0 || y >= this.canvas.height) {
            return null;
        }

        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);

        return { gridX, gridY };
    }

    private getClampedCanvasCoordinates(clientX: number, clientY: number): { x: number, y: number } {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;
        const clampedX = Math.max(0, Math.min(canvasX, this.canvas.width));
        const clampedY = Math.max(0, Math.min(canvasY, this.canvas.height));
        return { x: clampedX, y: clampedY };
    }

    private getGridAreaFromCanvasCoordinates(
        startCanvasX: number, startCanvasY: number,
        endCanvasX: number, endCanvasY: number
    ): { minGridX: number, minGridY: number, maxGridX: number, maxGridY: number } {
        const minGridX = Math.floor(Math.min(startCanvasX, endCanvasX) / this.tileSize);
        const minGridY = Math.floor(Math.min(startCanvasY, endCanvasY) / this.tileSize);
        const maxGridX = Math.floor((Math.max(startCanvasX, endCanvasX) + 0.001) / this.tileSize);
        const maxGridY = Math.floor((Math.max(startCanvasY, endCanvasY) + 0.001) / this.tileSize);
        return { minGridX, minGridY, maxGridX, maxGridY };
    }


    private handleMouseDown(e: MouseEvent): void {
        if (e.button !== 0) return;

        const coords = this.getClampedCanvasCoordinates(e.clientX, e.clientY);
        if (coords.x < 0 || coords.x >= this.canvas.width || coords.y < 0 || coords.y >= this.canvas.height) {
            return;
        }

        this.dragStartClientX = e.clientX;
        this.dragStartClientY = e.clientY;
        this.isDragging = false;
        this.dragHighlightedBlocks.clear();

        this.selectionOverlay = document.createElement('div');
        Object.assign(this.selectionOverlay.style, {
            position: 'fixed',
            border: '1px dashed #0078d7',
            backgroundColor: 'rgba(0, 120, 215, 0.1)',
            pointerEvents: 'none',
            zIndex: '1000',
            left: `${e.clientX}px`,
            top: `${e.clientY}px`,
            width: '0px',
            height: '0px',
        });

        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);

        e.preventDefault();
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.isDragging) {
            const dx = e.clientX - this.dragStartClientX;
            const dy = e.clientY - this.dragStartClientY;
            if (Math.sqrt(dx * dx + dy * dy) > 3) {
                this.isDragging = true;
                if (this.selectionOverlay) {
                    document.body.appendChild(this.selectionOverlay);
                }
            }
        }

        if (!this.isDragging || !this.selectionOverlay) return;

        const currentX = e.clientX;
        const currentY = e.clientY;
        const overlayLeft = Math.min(this.dragStartClientX, currentX);
        const overlayTop = Math.min(this.dragStartClientY, currentY);
        const overlayWidth = Math.abs(currentX - this.dragStartClientX);
        const overlayHeight = Math.abs(currentY - this.dragStartClientY);

        Object.assign(this.selectionOverlay.style, {
            left: `${overlayLeft}px`,
            top: `${overlayTop}px`,
            width: `${overlayWidth}px`,
            height: `${overlayHeight}px`,
        });

        const startCoords = this.getClampedCanvasCoordinates(this.dragStartClientX, this.dragStartClientY);
        const endCoords = this.getClampedCanvasCoordinates(currentX, currentY);
        const { minGridX, minGridY, maxGridX, maxGridY } = this.getGridAreaFromCanvasCoordinates(
            startCoords.x, startCoords.y, endCoords.x, endCoords.y
        );

        const newDraggedBlocks = new Set<string>();
        for (let y = minGridY; y <= maxGridY; y++) {
            for (let x = minGridX; x <= maxGridX; x++) {
                if (this.editor.isValidCoordinate(x, y)) {
                    newDraggedBlocks.add(`${x},${y}`);
                }
            }
        }

        this.dragHighlightedBlocks.forEach(blockKey => {
            if (!newDraggedBlocks.has(blockKey)) {
                const [x, y] = blockKey.split(',').map(Number);
                this.editor.unhighlightBlockTemporary(x, y);
            }
        });

        newDraggedBlocks.forEach(blockKey => {
            if (!this.dragHighlightedBlocks.has(blockKey)) {
                const [x, y] = blockKey.split(',').map(Number);
                this.editor.highlightBlockTemporary(x, y);
            }
        });

        this.dragHighlightedBlocks = newDraggedBlocks;
    }

    private handleMouseUp(e: MouseEvent): void {
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);

        this.dragHighlightedBlocks.forEach(blockKey => {
            const [x, y] = blockKey.split(',').map(Number);
            this.editor.unhighlightBlockTemporary(x, y);
        });
        this.dragHighlightedBlocks.clear();

        if (this.selectionOverlay?.parentElement) {
            document.body.removeChild(this.selectionOverlay);
            this.selectionOverlay = null;
        }

        if (this.isDragging) {
            const startCoords = this.getClampedCanvasCoordinates(this.dragStartClientX, this.dragStartClientY);
            const endCoords = this.getClampedCanvasCoordinates(e.clientX, e.clientY);
            const { minGridX, minGridY, maxGridX, maxGridY } = this.getGridAreaFromCanvasCoordinates(
                startCoords.x, startCoords.y, endCoords.x, endCoords.y
            );

            const multiSelect = this.isCtrlOrMeta(e);
            this.editor.selectBlocksInArea(minGridX, minGridY, maxGridX, maxGridY, multiSelect);
        } else {
            const gridCoords = this.getGridCoordinates(e.clientX, e.clientY);
            if (gridCoords && this.editor.isValidCoordinate(gridCoords.gridX, gridCoords.gridY)) {
                const multiSelect = this.isCtrlOrMeta(e);
                this.editor.toggleBlockSelection(gridCoords.gridX, gridCoords.gridY, multiSelect);
            }
        }

        this.isDragging = false;
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        const isModifier = this.isCtrlOrMeta(e);
        const key = e.key.toLowerCase();
        let handled = true;

        switch (key) {
            case 'delete':
                this.editor.deleteSelectedBlocks();
                break;
            case 'z':
                if (isModifier && !e.shiftKey) this.editor.undo();
                else if (isModifier && e.shiftKey) this.editor.redo();
                else handled = false;
                break;
            case 'y':
                if (isModifier) this.editor.redo();
                else handled = false;
                break;
            case 'x':
                if (isModifier) this.editor.cutSelection();
                else handled = false;
                break;
            case 'c':
                if (isModifier) this.editor.copySelection();
                else handled = false;
                break;
            case 'v':
                if (isModifier) this.editor.pasteSelection();
                else handled = false;
                break;
            case 'a':
                if (isModifier) this.editor.selectAll();
                else handled = false;
                break;
            case 's':
                if (isModifier) this.editor.saveToFile();
                else handled = false;
                break;
            case 'o':
                if (isModifier) this.editor.loadFromFile();
                else handled = false;
                break;
            default:
                handled = false;
        }

        if (handled) {
            e.preventDefault();
        }
    }

    private handleContextMenu(e: MouseEvent): void {
        e.preventDefault();

        document.getElementById('mapEditorContextMenu')?.remove();

        const contextMenu = document.createElement('div');
        contextMenu.id = 'mapEditorContextMenu';
        Object.assign(contextMenu.style, {
            position: 'absolute',
            left: `${e.pageX}px`,
            top: `${e.pageY}px`,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            padding: '5px 0',
            zIndex: '1001',
            minWidth: '150px',
            fontFamily: 'sans-serif',
            fontSize: '14px',
        });

        this.editor.populateContextMenu(contextMenu);
        document.body.appendChild(contextMenu);

        const menuRect = contextMenu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - menuRect.width - 5}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            contextMenu.style.top = `${window.innerHeight - menuRect.height - 5}px`;
        }
    }
}
