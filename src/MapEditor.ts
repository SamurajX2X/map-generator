import { ActionManager } from './ActionManager.js';
import { CanvasManager } from './CanvasManager.js';
import { FileManager, MapSaveData } from './FileManager.js';
import { InputHandler } from './InputHandler.js';
import { MapAction, TextureAction, BatchAction } from './actions.js';

export class MapEditor {
    private canvas: HTMLCanvasElement;
    private tileSize: number = 32;
    private mapGrid: string[][] = [];
    private spritesheet!: HTMLImageElement;
    private spritesheetRows: number = 32;
    private spritesheetCols: number = 20;
    private isSpritesheetLoaded: boolean = false;
    private selectedBlocks: Set<string> = new Set();

    private clipboardData: { texture: string, x: number, y: number }[] = [];
    private clipboardWidth: number = 0;
    private clipboardHeight: number = 0;

    private actionManager: ActionManager;
    private canvasManager: CanvasManager;
    private fileManager: FileManager;
    private inputHandler: InputHandler;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.actionManager = new ActionManager();
        this.canvasManager = new CanvasManager(this.canvas, this.tileSize);
        this.fileManager = new FileManager();
        this.inputHandler = new InputHandler(this.canvas, this, this.tileSize);

        this.initializeCanvas();
        this.loadSpritesheet();
        this.initializeMapGrid();
    }

    private initializeCanvas(): void {
        const canvasContainer = this.canvas.parentElement;
        let containerWidth = 800;
        let containerHeight = 600;

        if (canvasContainer) {
            containerWidth = Math.max(canvasContainer.clientWidth, this.tileSize);
            containerHeight = Math.max(canvasContainer.clientHeight || containerHeight, this.tileSize);
            this.canvas.width = Math.floor(containerWidth / this.tileSize) * this.tileSize;
            this.canvas.height = Math.floor(containerHeight / this.tileSize) * this.tileSize;
        } else {
            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;
        }

        this.canvasManager.clearCanvas();
        this.canvasManager.drawGrid();
    }

    private initializeMapGrid(): void {
        const rows = Math.floor(this.canvas.height / this.tileSize);
        const cols = Math.floor(this.canvas.width / this.tileSize);
        if (this.mapGrid.length !== rows || (this.mapGrid[0] && this.mapGrid[0].length !== cols)) {
            this.mapGrid = Array(rows).fill(null).map(() => Array(cols).fill(""));
        }
        else if (this.mapGrid.length > 0) {
            if (this.mapGrid.length > rows) this.mapGrid.length = rows;
            this.mapGrid.forEach(row => {
                if (row.length > cols) row.length = cols;
                while (row.length < cols) row.push("");
            });
            while (this.mapGrid.length < rows) {
                this.mapGrid.push(Array(cols).fill(""));
            }
        }
    }


    private loadSpritesheet(): void {
        this.spritesheet = new Image();
        this.spritesheet.src = './images/sprites.png';
        this.spritesheet.onload = () => {
            this.isSpritesheetLoaded = true;
            this.canvasManager.setSpritesheet(this.spritesheet, this.spritesheetRows, this.spritesheetCols);
            this.redrawEntireMap();
        };
        this.spritesheet.onerror = () => {
            console.error("Spritesheet loading error");
        };
    }

    public setCurrentTexture(texture: string): void {
        if (this.selectedBlocks.size === 0 || !this.isSpritesheetLoaded) return;

        const actions: MapAction[] = [];
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
        }
        this.clearSelection();
    }


    public exportMap(): string[][] {
        return this.mapGrid;
    }

    public clearMap(): void {
        const actions: MapAction[] = [];

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
    }

    public placeTextureInternal(gridX: number, gridY: number, textureId: string): void {
        if (this.isValidCoordinate(gridX, gridY)) {
            this.mapGrid[gridY][gridX] = textureId;
            this.canvasManager.redrawBlock(gridX, gridY, textureId);
            if (this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.highlightBlock(gridX, gridY);
            }
        }
    }

    public redrawEntireMap(): void {
        this.canvasManager.redrawEntireMap(this.mapGrid);
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.highlightBlock(x, y);
            }
        });
    }

    public toggleBlockSelection(gridX: number, gridY: number, multiSelect: boolean): void {
        if (!this.isValidCoordinate(gridX, gridY)) return;

        const blockKey = `${gridX},${gridY}`;
        const isAlreadySelected = this.selectedBlocks.has(blockKey);

        if (!multiSelect) {
            this.selectedBlocks.forEach(key => {
                if (key !== blockKey) {
                    const [x, y] = key.split(',').map(Number);
                    this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
                }
            });
            this.selectedBlocks.clear();
        }

        if (isAlreadySelected && multiSelect) {
            this.selectedBlocks.delete(blockKey);
            this.canvasManager.redrawBlock(gridX, gridY, this.mapGrid[gridY][gridX]);
        } else if (!isAlreadySelected) {
            this.selectedBlocks.add(blockKey);
            this.canvasManager.highlightBlock(gridX, gridY);
        } else if (!multiSelect && isAlreadySelected) {
            this.selectedBlocks.add(blockKey);
            this.canvasManager.highlightBlock(gridX, gridY);
        }
    }

    public highlightBlockTemporary(gridX: number, gridY: number): void {
        if (this.isValidCoordinate(gridX, gridY)) {
            if (!this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.highlightBlock(gridX, gridY);
            }
        }
    }

    public unhighlightBlockTemporary(gridX: number, gridY: number): void {
        if (this.isValidCoordinate(gridX, gridY)) {
            if (!this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.redrawBlock(gridX, gridY, this.mapGrid[gridY][gridX]);
            }
        }
    }

    public selectBlocksInArea(minGridX: number, minGridY: number, maxGridX: number, maxGridY: number, multiSelect: boolean): void {
        const blocksToSelect = new Set<string>();

        for (let y = minGridY; y <= maxGridY; y++) {
            for (let x = minGridX; x <= maxGridX; x++) {
                if (this.isValidCoordinate(x, y)) {
                    blocksToSelect.add(`${x},${y}`);
                }
            }
        }

        if (!multiSelect) {
            this.clearSelection();
            blocksToSelect.forEach(blockKey => {
                this.selectedBlocks.add(blockKey);
                const [x, y] = blockKey.split(',').map(Number);
                this.canvasManager.highlightBlock(x, y);
            });
        } else {
            blocksToSelect.forEach(blockKey => {
                if (!this.selectedBlocks.has(blockKey)) {
                    this.selectedBlocks.add(blockKey);
                    const [x, y] = blockKey.split(',').map(Number);
                    this.canvasManager.highlightBlock(x, y);
                }
            });
        }
    }

    private clearAllHighlights(): void {
        for (const blockKey of this.selectedBlocks) {
            const [x, y] = blockKey.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
            }
        }
    }

    public selectAll(): void {
        this.clearSelection();
        for (let y = 0; y < this.mapGrid.length; y++) {
            for (let x = 0; x < this.mapGrid[0].length; x++) {
                const blockKey = `${x},${y}`;
                this.selectedBlocks.add(blockKey);
                this.canvasManager.highlightBlock(x, y);
            }
        }
    }

    private clearSelection(): void {
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
            }
        });
        this.selectedBlocks.clear();
    }

    public cutSelection(): void {
        if (this.selectedBlocks.size === 0) return;
        this.copySelection();
        this.deleteSelectedBlocks();
    }

    public copySelection(): void {
        if (this.selectedBlocks.size === 0) return;

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
    }

    public pasteSelection(): void {
        if (this.clipboardData.length === 0 || this.selectedBlocks.size === 0) {
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

        if (anchorX === Infinity) return;

        const actions: MapAction[] = [];
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
            this.clearSelection();
        }
    }

    public deleteSelectedBlocks(): void {
        if (this.selectedBlocks.size === 0) return;

        const actions: MapAction[] = [];
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
        }

        if (actions.length > 0) {
            this.actionManager.recordAction(new BatchAction(actions));
        }
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) this.canvasManager.highlightBlock(x, y);
        });
    }


    public undo(): void {
        this.actionManager.undo();
        this.clearSelection();
    }

    public redo(): void {
        this.actionManager.redo();
        this.clearSelection();
    }

    public saveToFile(): void {
        const saveData: MapSaveData = {
            version: 1,
            width: this.mapGrid[0]?.length || 0,
            height: this.mapGrid.length,
            tileSize: this.tileSize,
            grid: this.mapGrid
        };
        this.fileManager.saveToFile(saveData);
    }

    public async loadFromFile(): Promise<void> {
        try {
            const data = await this.fileManager.loadFromFile();

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

        } catch (error) {
            console.error("Load operation failed or was cancelled:", error);
            alert(`Load failed: ${error instanceof Error ? error.message : error}`);
        }
    }

    private applyLoadedData(data: MapSaveData): void {
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
    }


    public populateContextMenu(contextMenu: HTMLDivElement): void {
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
            } else {
                const menuItem = document.createElement('div');
                menuItem.textContent = itemData.label;
                menuItem.style.padding = '8px 15px';
                menuItem.style.cursor = itemData.disabled ? 'default' : 'pointer';
                menuItem.style.color = itemData.disabled ? '#999' : '#333';

                if (!itemData.disabled) {
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        itemData.action?.();
                        contextMenu.style.display = 'none';
                    });
                    menuItem.addEventListener('mouseenter', () => { menuItem.style.backgroundColor = '#eee'; });
                    menuItem.addEventListener('mouseleave', () => { menuItem.style.backgroundColor = 'white'; });
                }
                contextMenu.appendChild(menuItem);
            }
        });
    }

    public isValidCoordinate(gridX: number, gridY: number): boolean {
        return gridY >= 0 && gridY < this.mapGrid.length &&
            gridX >= 0 && gridX < (this.mapGrid[0]?.length || 0);
    }

    private autoPositionSelection(): void {
        if (this.selectedBlocks.size !== 1) return;

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
