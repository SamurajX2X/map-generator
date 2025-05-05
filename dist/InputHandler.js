export class InputHandler {
    constructor(canvas, editor, tileSize) {
        this.canvas = canvas;
        this.editor = editor;
        this.tileSize = tileSize;
        this.isDragging = false;
        this.selectionOverlay = null;
        this.dragStartClientX = 0;
        this.dragStartClientY = 0;
        this.dragHighlightedBlocks = new Set();
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);
        this.bindEvents();
    }
    updateTileSize(newTileSize) {
        this.tileSize = newTileSize;
    }
    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        document.addEventListener('click', (e) => {
            const contextMenu = document.getElementById('mapEditorContextMenu');
            if (contextMenu && !contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });
    }
    isCtrlOrMeta(e) {
        return e.ctrlKey || e.metaKey;
    }
    getGridCoordinates(clientX, clientY) {
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
    handleMouseDown(e) {
        if (e.button !== 0)
            return;
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        if (canvasX < 0 || canvasX >= this.canvas.width || canvasY < 0 || canvasY >= this.canvas.height) {
            return;
        }
        this.dragStartClientX = e.clientX;
        this.dragStartClientY = e.clientY;
        this.isDragging = false;
        this.dragHighlightedBlocks.clear();
        this.selectionOverlay = document.createElement('div');
        this.selectionOverlay.style.position = 'fixed';
        this.selectionOverlay.style.border = '1px dashed #0078d7';
        this.selectionOverlay.style.backgroundColor = 'rgba(0, 120, 215, 0.1)';
        this.selectionOverlay.style.pointerEvents = 'none';
        this.selectionOverlay.style.zIndex = '1000';
        this.selectionOverlay.style.left = `${e.clientX}px`;
        this.selectionOverlay.style.top = `${e.clientY}px`;
        this.selectionOverlay.style.width = '0px';
        this.selectionOverlay.style.height = '0px';
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
        e.preventDefault();
    }
    handleMouseMove(e) {
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
        if (!this.isDragging || !this.selectionOverlay)
            return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        const overlayLeft = Math.min(this.dragStartClientX, currentX);
        const overlayTop = Math.min(this.dragStartClientY, currentY);
        const overlayWidth = Math.abs(currentX - this.dragStartClientX);
        const overlayHeight = Math.abs(currentY - this.dragStartClientY);
        this.selectionOverlay.style.left = `${overlayLeft}px`;
        this.selectionOverlay.style.top = `${overlayTop}px`;
        this.selectionOverlay.style.width = `${overlayWidth}px`;
        this.selectionOverlay.style.height = `${overlayHeight}px`;
        const rect = this.canvas.getBoundingClientRect();
        const startCanvasX = this.dragStartClientX - rect.left;
        const startCanvasY = this.dragStartClientY - rect.top;
        const endCanvasX = currentX - rect.left;
        const endCanvasY = currentY - rect.top;
        const clampedStartX = Math.max(0, Math.min(startCanvasX, this.canvas.width));
        const clampedStartY = Math.max(0, Math.min(startCanvasY, this.canvas.height));
        const clampedEndX = Math.max(0, Math.min(endCanvasX, this.canvas.width));
        const clampedEndY = Math.max(0, Math.min(endCanvasY, this.canvas.height));
        const minGridX = Math.floor(Math.min(clampedStartX, clampedEndX) / this.tileSize);
        const minGridY = Math.floor(Math.min(clampedStartY, clampedEndY) / this.tileSize);
        const maxGridX = Math.floor((Math.max(clampedStartX, clampedEndX) + 0.001) / this.tileSize);
        const maxGridY = Math.floor((Math.max(clampedStartY, clampedEndY) + 0.001) / this.tileSize);
        const newDraggedBlocks = new Set();
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
    handleMouseUp(e) {
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
        this.dragHighlightedBlocks.forEach(blockKey => {
            const [x, y] = blockKey.split(',').map(Number);
            this.editor.unhighlightBlockTemporary(x, y);
        });
        this.dragHighlightedBlocks.clear();
        if (this.selectionOverlay && this.selectionOverlay.parentElement) {
            document.body.removeChild(this.selectionOverlay);
            this.selectionOverlay = null;
        }
        const rect = this.canvas.getBoundingClientRect();
        if (this.isDragging) {
            const startCanvasX = this.dragStartClientX - rect.left;
            const startCanvasY = this.dragStartClientY - rect.top;
            const endCanvasX = e.clientX - rect.left;
            const endCanvasY = e.clientY - rect.top;
            const clampedStartX = Math.max(0, Math.min(startCanvasX, this.canvas.width));
            const clampedStartY = Math.max(0, Math.min(startCanvasY, this.canvas.height));
            const clampedEndX = Math.max(0, Math.min(endCanvasX, this.canvas.width));
            const clampedEndY = Math.max(0, Math.min(endCanvasY, this.canvas.height));
            const minGridX = Math.floor(Math.min(clampedStartX, clampedEndX) / this.tileSize);
            const minGridY = Math.floor(Math.min(clampedStartY, clampedEndY) / this.tileSize);
            const maxGridX = Math.floor((Math.max(clampedStartX, clampedEndX) + 0.001) / this.tileSize);
            const maxGridY = Math.floor((Math.max(clampedStartY, clampedEndY) + 0.001) / this.tileSize);
            const multiSelect = this.isCtrlOrMeta(e);
            console.log(`Final Selection area: (${minGridX},${minGridY}) to (${maxGridX},${maxGridY}), multiSelect: ${multiSelect}`);
            this.editor.selectBlocksInArea(minGridX, minGridY, maxGridX, maxGridY, multiSelect);
        }
        else {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const gridX = Math.floor(x / this.tileSize);
            const gridY = Math.floor(y / this.tileSize);
            if (this.editor.isValidCoordinate(gridX, gridY)) {
                const multiSelect = this.isCtrlOrMeta(e);
                console.log(`Click selection: (${gridX},${gridY}), multiSelect: ${multiSelect}`);
                this.editor.toggleBlockSelection(gridX, gridY, multiSelect);
            }
        }
        this.isDragging = false;
    }
    handleKeyDown(e) {
        const isModifier = this.isCtrlOrMeta(e);
        const key = e.key.toLowerCase();
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        let handled = true;
        if (key === 'delete') {
            this.editor.deleteSelectedBlocks();
        }
        else if (isModifier && key === 'z' && !e.shiftKey) {
            this.editor.undo();
        }
        else if (isModifier && (key === 'y' || (e.shiftKey && key === 'z'))) {
            this.editor.redo();
        }
        else if (isModifier && key === 'x') {
            this.editor.cutSelection();
        }
        else if (isModifier && key === 'c') {
            this.editor.copySelection();
        }
        else if (isModifier && key === 'v') {
            this.editor.pasteSelection();
        }
        else if (isModifier && key === 'a') {
            this.editor.selectAll();
        }
        else if (isModifier && key === 's') {
            this.editor.saveToFile();
        }
        else if (isModifier && key === 'o') {
            this.editor.loadFromFile();
        }
        else {
            handled = false;
        }
        if (handled) {
            e.preventDefault();
        }
    }
    handleContextMenu(e) {
        e.preventDefault();
        const existingMenu = document.getElementById('mapEditorContextMenu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
        }
        const contextMenu = document.createElement('div');
        contextMenu.id = 'mapEditorContextMenu';
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.style.backgroundColor = 'white';
        contextMenu.style.border = '1px solid #ccc';
        contextMenu.style.boxShadow = '2px 2px 5px rgba(0, 0, 0, 0.2)';
        contextMenu.style.borderRadius = '4px';
        contextMenu.style.padding = '5px 0';
        contextMenu.style.zIndex = '1001';
        contextMenu.style.minWidth = '150px';
        contextMenu.style.fontFamily = 'sans-serif';
        contextMenu.style.fontSize = '14px';
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
