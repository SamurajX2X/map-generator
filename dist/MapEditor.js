var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ActionManager } from './ActionManager.js';
import { CanvasManager } from './CanvasManager.js';
import { FileManager } from './FileManager.js';
import { InputHandler } from './InputHandler.js';
import { TextureAction, BatchAction } from './actions.js';
export class MapEditor {
    constructor(canvas) {
        this.tileSize = 32;
        this.mapGrid = [];
        this.spritesheetRows = 32;
        this.spritesheetCols = 20;
        this.isSpritesheetLoaded = false;
        this.selectedBlocks = new Set();
        this.clipboardData = [];
        this.clipboardWidth = 0;
        this.clipboardHeight = 0;
        this.canvas = canvas;
        this.actionManager = new ActionManager();
        this.canvasManager = new CanvasManager(this.canvas, this.tileSize);
        this.fileManager = new FileManager();
        this.inputHandler = new InputHandler(this.canvas, this, this.tileSize);
        this.initializeCanvas();
        this.loadSpritesheet();
        this.initializeMapGrid();
    }
    initializeCanvas() {
        const canvasContainer = this.canvas.parentElement;
        let containerWidth = 800;
        let containerHeight = 600;
        if (canvasContainer) {
            containerWidth = Math.max(canvasContainer.clientWidth, this.tileSize);
            containerHeight = Math.max(canvasContainer.clientHeight || containerHeight, this.tileSize);
            this.canvas.width = Math.floor(containerWidth / this.tileSize) * this.tileSize;
            this.canvas.height = Math.floor(containerHeight / this.tileSize) * this.tileSize;
        }
        else {
            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;
        }
        this.canvasManager.clearCanvas();
        this.canvasManager.drawGrid();
    }
    initializeMapGrid() {
        const rows = Math.floor(this.canvas.height / this.tileSize);
        const cols = Math.floor(this.canvas.width / this.tileSize);
        if (this.mapGrid.length !== rows || (this.mapGrid[0] && this.mapGrid[0].length !== cols)) {
            this.mapGrid = Array(rows).fill(null).map(() => Array(cols).fill(""));
        }
        else if (this.mapGrid.length > 0) {
            if (this.mapGrid.length > rows)
                this.mapGrid.length = rows;
            this.mapGrid.forEach(row => {
                if (row.length > cols)
                    row.length = cols;
                while (row.length < cols)
                    row.push("");
            });
            while (this.mapGrid.length < rows) {
                this.mapGrid.push(Array(cols).fill(""));
            }
        }
    }
    loadSpritesheet() {
        this.spritesheet = new Image();
        this.spritesheet.src = './images/sprites.png';
        this.spritesheet.onload = () => {
            this.isSpritesheetLoaded = true;
            this.canvasManager.setSpritesheet(this.spritesheet, this.spritesheetRows, this.spritesheetCols);
            this.redrawEntireMap();
        };
        this.spritesheet.onerror = () => {
            console.error("Blad spritesheetu ");
        };
    }
    setCurrentTexture(texture) {
        if (this.selectedBlocks.size === 0 || !this.isSpritesheetLoaded)
            return;
        const actions = [];
        for (const blockKey of this.selectedBlocks) {
            const [gridX, gridY] = blockKey.split(',').map(Number);
            if (this.isValidCoordinate(gridX, gridY)) {
                const oldTexture = this.mapGrid[gridY][gridX];
                if (oldTexture !== texture) {
                    const action = new TextureAction(this, gridX, gridY, texture, oldTexture);
                    actions.push(action);
                    action.execute();
                }
            }
        }
        if (actions.length > 0) {
            this.actionManager.recordAction(new BatchAction(actions));
            this.clearSelection();
        }
        else {
            this.clearSelection();
        }
    }
    exportMap() {
        return this.mapGrid;
    }
    clearMap() {
        const oldGrid = JSON.parse(JSON.stringify(this.mapGrid));
        const actions = [];
        for (let y = 0; y < this.mapGrid.length; y++) {
            for (let x = 0; x < this.mapGrid[y].length; x++) {
                if (this.mapGrid[y][x] !== "") {
                    actions.push(new TextureAction(this, x, y, "", this.mapGrid[y][x]));
                    this.mapGrid[y][x] = "";
                }
            }
        }
        if (actions.length > 0) {
            this.actionManager.recordAction(new BatchAction(actions));
        }
        this.clearSelection();
        this.canvasManager.redrawEntireMap(this.mapGrid);
        console.log("brak cleru");
    }
    placeTextureInternal(gridX, gridY, textureId) {
        if (this.isValidCoordinate(gridX, gridY)) {
            this.mapGrid[gridY][gridX] = textureId;
            this.canvasManager.redrawBlock(gridX, gridY, textureId);
            if (this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.highlightBlock(gridX, gridY);
            }
        }
    }
    redrawEntireMap() {
        this.canvasManager.redrawEntireMap(this.mapGrid);
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.highlightBlock(x, y);
            }
        });
    }
    /**
     * Toggles the selection state of a single block.
     * @param gridX - The grid column index.
     * @param gridY - The grid row index.
     * @param multiSelect - True if Ctrl/Meta key is held for multi-selection.
     */
    toggleBlockSelection(gridX, gridY, multiSelect) {
        if (!this.isValidCoordinate(gridX, gridY))
            return;
        const blockKey = `${gridX},${gridY}`;
        const isAlreadySelected = this.selectedBlocks.has(blockKey);
        console.log(`Toggle block (${gridX},${gridY}), multiSelect: ${multiSelect}, already selected: ${isAlreadySelected}`);
        // If not multi-selecting, clear previous selection *before* toggling
        if (!multiSelect) {
            // Clear everything except the block potentially being clicked
            this.selectedBlocks.forEach(key => {
                if (key !== blockKey) {
                    const [x, y] = key.split(',').map(Number);
                    this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
                }
            });
            this.selectedBlocks.clear();
            // If the clicked block was selected, it will be re-added below
        }
        // Now toggle the clicked block
        if (isAlreadySelected && multiSelect) { // Only deselect if multi-selecting
            this.selectedBlocks.delete(blockKey);
            this.canvasManager.redrawBlock(gridX, gridY, this.mapGrid[gridY][gridX]);
        }
        else if (!isAlreadySelected) { // Select if not already selected
            this.selectedBlocks.add(blockKey);
            this.canvasManager.highlightBlock(gridX, gridY);
        }
        else if (!multiSelect && isAlreadySelected) {
            // If single-clicking an already selected block, keep it selected
            this.selectedBlocks.add(blockKey); // Ensure it's in the set after clearing
            this.canvasManager.highlightBlock(gridX, gridY); // Ensure it's highlighted
        }
        console.log("Selected blocks:", Array.from(this.selectedBlocks));
    }
    /**
     * Temporarily highlights a block during drag selection.
     * Does not add the block to the main selectedBlocks set.
     */
    highlightBlockTemporary(gridX, gridY) {
        if (this.isValidCoordinate(gridX, gridY)) {
            // Avoid highlighting if it's already part of the final selection
            if (!this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.highlightBlock(gridX, gridY);
            }
        }
    }
    /**
     * Removes temporary highlight from a block during drag selection.
     * Restores the block to its normal state (texture + grid).
     * Does not affect the main selectedBlocks set.
     */
    unhighlightBlockTemporary(gridX, gridY) {
        if (this.isValidCoordinate(gridX, gridY)) {
            // Avoid unhighlighting if it's part of the final selection
            if (!this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.redrawBlock(gridX, gridY, this.mapGrid[gridY][gridX]);
            }
        }
    }
    /**
     * Selects all blocks within a specified rectangular area.
     * @param minGridX - Minimum grid column index.
     * @param minGridY - Minimum grid row index.
     * @param maxGridX - Maximum grid column index.
     * @param maxGridY - Maximum grid row index.
     * @param multiSelect - True if Ctrl/Meta key is held to add to existing selection.
     */
    selectBlocksInArea(minGridX, minGridY, maxGridX, maxGridY, multiSelect) {
        const blocksToSelect = new Set();
        // Determine which blocks should be in the final selection
        for (let y = minGridY; y <= maxGridY; y++) {
            for (let x = minGridX; x <= maxGridX; x++) {
                if (this.isValidCoordinate(x, y)) {
                    blocksToSelect.add(`${x},${y}`);
                }
            }
        }
        if (!multiSelect) {
            // Clear existing selection completely if not multi-selecting
            this.clearSelection();
            // Add the newly selected blocks
            blocksToSelect.forEach(blockKey => {
                this.selectedBlocks.add(blockKey);
                const [x, y] = blockKey.split(',').map(Number);
                this.canvasManager.highlightBlock(x, y);
            });
        }
        else {
            // Add to existing selection if multi-selecting
            blocksToSelect.forEach(blockKey => {
                if (!this.selectedBlocks.has(blockKey)) {
                    this.selectedBlocks.add(blockKey);
                    const [x, y] = blockKey.split(',').map(Number);
                    this.canvasManager.highlightBlock(x, y);
                }
            });
        }
        console.log(`Area selection finalized. Total selected: ${this.selectedBlocks.size}`);
        console.log("Selected blocks:", Array.from(this.selectedBlocks));
    }
    /**
     * Helper method to clear selection highlights without altering the selectedBlocks set
     */
    clearAllHighlights() {
        for (const blockKey of this.selectedBlocks) {
            const [x, y] = blockKey.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
            }
        }
    }
    selectAll() {
        this.clearSelection();
        for (let y = 0; y < this.mapGrid.length; y++) {
            for (let x = 0; x < this.mapGrid[0].length; x++) {
                const blockKey = `${x},${y}`;
                this.selectedBlocks.add(blockKey);
                this.canvasManager.highlightBlock(x, y);
            }
        }
        console.log("selectd all bloki");
    }
    clearSelection() {
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
            }
        });
        this.selectedBlocks.clear();
    }
    cutSelection() {
        if (this.selectedBlocks.size === 0)
            return;
        this.copySelection();
        this.deleteSelectedBlocks();
        console.log("brak cleru");
    }
    copySelection() {
        if (this.selectedBlocks.size === 0)
            return;
        this.clipboardData = [];
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (const blockKey of this.selectedBlocks) {
            const [x, y] = blockKey.split(',').map(Number);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        this.clipboardWidth = maxX - minX + 1;
        this.clipboardHeight = maxY - minY + 1;
        for (const blockKey of this.selectedBlocks) {
            const [x, y] = blockKey.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                const relX = x - minX;
                const relY = y - minY;
                const texture = this.mapGrid[y][x];
                this.clipboardData.push({ texture, x: relX, y: relY });
            }
        }
        console.log("zapisane:", this.clipboardData.length, "items");
    }
    pasteSelection() {
        if (this.clipboardData.length === 0 || this.selectedBlocks.size === 0) {
            console.log("brak cleru no rel");
            return;
        }
        let anchorX = Infinity, anchorY = Infinity;
        for (const blockKey of this.selectedBlocks) {
            const [x, y] = blockKey.split(',').map(Number);
            if (y < anchorY || (y === anchorY && x < anchorX)) {
                anchorX = x;
                anchorY = y;
            }
        }
        if (anchorX === Infinity)
            return;
        const actions = [];
        for (const item of this.clipboardData) {
            const targetX = anchorX + item.x;
            const targetY = anchorY + item.y;
            if (this.isValidCoordinate(targetX, targetY)) {
                const oldTexture = this.mapGrid[targetY][targetX];
                if (oldTexture !== item.texture) {
                    const action = new TextureAction(this, targetX, targetY, item.texture, oldTexture);
                    actions.push(action);
                    action.execute();
                }
            }
        }
        if (actions.length > 0) {
            this.actionManager.recordAction(new BatchAction(actions));
            console.log("wklejone");
            this.clearSelection();
        }
    }
    deleteSelectedBlocks() {
        if (this.selectedBlocks.size === 0)
            return;
        const actions = [];
        for (const blockKey of this.selectedBlocks) {
            const [gridX, gridY] = blockKey.split(',').map(Number);
            if (this.isValidCoordinate(gridX, gridY)) {
                const oldTexture = this.mapGrid[gridY][gridX];
                if (oldTexture !== "") {
                    const action = new TextureAction(this, gridX, gridY, "", oldTexture);
                    actions.push(action);
                    action.execute();
                }
            }
            // this.selectedBlocks.clear();
        }
        if (actions.length > 0) {
            this.actionManager.recordAction(new BatchAction(actions));
            console.log("Deleted selected blocks.");
        }
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y))
                this.canvasManager.highlightBlock(x, y);
        });
    }
    undo() {
        this.actionManager.undo();
        this.clearSelection();
    }
    redo() {
        this.actionManager.redo();
        this.clearSelection();
    }
    saveToFile() {
        var _a;
        const saveData = {
            version: 1,
            width: ((_a = this.mapGrid[0]) === null || _a === void 0 ? void 0 : _a.length) || 0,
            height: this.mapGrid.length,
            tileSize: this.tileSize,
            grid: this.mapGrid
        };
        this.fileManager.saveToFile(saveData);
    }
    loadFromFile() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.fileManager.loadFromFile();
                const oldGrid = JSON.parse(JSON.stringify(this.mapGrid));
                const oldWidth = this.canvas.width;
                const oldHeight = this.canvas.height;
                const oldTileSize = this.tileSize;
                this.actionManager.recordAction({
                    execute: () => this.applyLoadedData(data),
                    undo: () => {
                        this.canvas.width = oldWidth;
                        this.canvas.height = oldHeight;
                        this.tileSize = oldTileSize;
                        this.canvasManager.updateTileSize(this.tileSize);
                        this.mapGrid = oldGrid;
                        this.redrawEntireMap();
                    }
                });
                this.applyLoadedData(data);
            }
            catch (error) {
                console.error("Load operation failed or was cancelled:", error);
                alert(`Load failed: ${error instanceof Error ? error.message : error}`);
            }
        });
    }
    applyLoadedData(data) {
        this.tileSize = data.tileSize;
        this.canvasManager.updateTileSize(this.tileSize);
        const newWidth = data.width * this.tileSize;
        const newHeight = data.height * this.tileSize;
        if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
        }
        this.mapGrid = data.grid;
        this.redrawEntireMap();
        this.actionManager.clearHistory();
        this.clearSelection();
        console.log("Map data applied.");
    }
    populateContextMenu(contextMenu) {
        const menuItems = [
            { label: 'Undo', disabled: !this.actionManager.canUndo(), action: () => this.undo() },
            { label: 'Redo', disabled: !this.actionManager.canRedo(), action: () => this.redo() },
            { label: '---' },
            { label: 'Cut', disabled: this.selectedBlocks.size === 0, action: () => this.cutSelection() },
            { label: 'Copy', disabled: this.selectedBlocks.size === 0, action: () => this.copySelection() },
            { label: 'Paste', disabled: this.clipboardData.length === 0 || this.selectedBlocks.size === 0, action: () => this.pasteSelection() },
            { label: '---' },
            { label: 'Delete', disabled: this.selectedBlocks.size === 0, action: () => this.deleteSelectedBlocks() },
            { label: 'Select All', action: () => this.selectAll() },
            { label: '---' },
            { label: 'Save Map...', action: () => this.saveToFile() },
            { label: 'Load Map...', action: () => this.loadFromFile() }
        ];
        menuItems.forEach(itemData => {
            if (itemData.label === '---') {
                const separator = document.createElement('div');
                separator.style.height = '1px';
                separator.style.backgroundColor = '#e0e0e0';
                separator.style.margin = '5px 0';
                contextMenu.appendChild(separator);
            }
            else {
                const menuItem = document.createElement('div');
                menuItem.textContent = itemData.label;
                menuItem.style.padding = '8px 15px';
                menuItem.style.cursor = itemData.disabled ? 'default' : 'pointer';
                menuItem.style.color = itemData.disabled ? '#999' : '#333';
                if (!itemData.disabled) {
                    menuItem.addEventListener('click', (e) => {
                        var _a;
                        e.stopPropagation();
                        (_a = itemData.action) === null || _a === void 0 ? void 0 : _a.call(itemData);
                        contextMenu.style.display = 'none';
                    });
                    menuItem.addEventListener('mouseenter', () => { menuItem.style.backgroundColor = '#eee'; });
                    menuItem.addEventListener('mouseleave', () => { menuItem.style.backgroundColor = 'white'; });
                }
                contextMenu.appendChild(menuItem);
            }
        });
    }
    isValidCoordinate(gridX, gridY) {
        var _a;
        return gridY >= 0 && gridY < this.mapGrid.length &&
            gridX >= 0 && gridX < (((_a = this.mapGrid[0]) === null || _a === void 0 ? void 0 : _a.length) || 0);
    }
    autoPositionSelection() {
        if (this.selectedBlocks.size !== 1)
            return;
        const [lastBlockKey] = this.selectedBlocks;
        let [x, y] = lastBlockKey.split(',').map(Number);
        this.clearSelection();
        x++;
        if (!this.isValidCoordinate(x, y)) {
            x = 0;
            y++;
        }
        if (this.isValidCoordinate(x, y)) {
            const nextBlockKey = `${x},${y}`;
            this.selectedBlocks.add(nextBlockKey);
            this.canvasManager.highlightBlock(x, y);
        }
    }
}
