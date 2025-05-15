import { ActionManager } from './ActionManager.js';
import { CanvasManager } from './CanvasManager.js';
import { FileManager, MapSaveData } from './FileManager.js';
import { InputHandler } from './InputHandler.js';
import { MapAction, TextureAction, BatchAction } from './actions.js';

/**
 * Główny edytor mapy
 * @param canvas - element canvas
 */
export class MapEditor {
    private canvas: HTMLCanvasElement; // tu jest canvas
    private tileSize: number = 32; // rozmiar kafelka
    private mapGrid: string[][] = []; // siatka mapy
    private spritesheet!: HTMLImageElement; // obrazek z teksturami
    private spritesheetRows: number = 32; // ile wierszy w spritesheet
    private spritesheetCols: number = 20; // ile kolumn w spritesheet
    private isSpritesheetLoaded: boolean = false; // czy zaladowano spritesheet
    private selectedBlocks: Set<string> = new Set(); // wybrane bloki
    private resizeTimeout: ReturnType<typeof setTimeout> | null = null; // timeout do obsługi zmiany rozmiaru okna

    private clipboardData: { texture: string, x: number, y: number }[] = []; // schowek do kopiowania
    private clipboardWidth: number = 0; // szerokosc schowka
    private clipboardHeight: number = 0; // wysokosc schowka

    private actionManager: ActionManager; // zarzadzanie undo redo
    private canvasManager: CanvasManager; // rysowanie na canvasie
    private fileManager: FileManager; // zapisywanie i wczytywanie plikow
    private inputHandler: InputHandler; // obsluga myszki i klawiatury

    /**
     * Tworzy nowy edytor mapy
     * @param canvas - element canvas
     */
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.actionManager = new ActionManager();
        this.canvasManager = new CanvasManager(this.canvas, this.tileSize);
        this.fileManager = new FileManager();
        this.inputHandler = new InputHandler(this.canvas, this, this.tileSize);
        this.initializeCanvas(); // inicjalizacja canvas
        this.loadSpritesheet(); // ladowanie tekstur
        this.initializeMapGrid(); // tworzenie siatki mapy

        // Dodanie obsługi zmiany rozmiaru okna by mapa automatycznie wypełniała dostępną przestrzeń
        window.addEventListener('resize', this.handleResize.bind(this));
    }    /**
     * Inicjalizuje canvas
     */
    private initializeCanvas(): void {
        const canvasContainer = this.canvas.parentElement;
        // Większe domyślne wartości, żeby mapa zajmowała większą część ekranu
        let containerWidth = 1200;
        let containerHeight = 800;

        // ustawianie rozmiaru canvas
        if (canvasContainer) {
            // Używamy pełnego dostępnego obszaru
            containerWidth = Math.max(canvasContainer.clientWidth, this.tileSize);
            containerHeight = Math.max(canvasContainer.clientHeight || containerHeight, this.tileSize);

            this.canvas.width = Math.floor(containerWidth / this.tileSize) * this.tileSize;
            this.canvas.height = Math.floor(containerHeight / this.tileSize) * this.tileSize;
        } else {
            this.canvas.width = containerWidth;
            this.canvas.height = containerHeight;
        }
        this.canvasManager.clearCanvas(); // czyszczenie canvas
        this.canvasManager.drawGrid(); // rysowanie siatki
    }

    /**
     * Obsługuje zmianę rozmiaru okna
     */
    private handleResize(): void {
        const canvasContainer = this.canvas.parentElement;
        if (!canvasContainer) return;

        // Delay resize to avoid performance issues
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }

        this.resizeTimeout = setTimeout(() => {
            const containerWidth = Math.max(canvasContainer.clientWidth, this.tileSize);
            const containerHeight = Math.max(canvasContainer.clientHeight, this.tileSize);

            // Preserve map data
            const oldMapGrid = JSON.parse(JSON.stringify(this.mapGrid));

            // Resize canvas
            this.canvas.width = Math.floor(containerWidth / this.tileSize) * this.tileSize;
            this.canvas.height = Math.floor(containerHeight / this.tileSize) * this.tileSize;

            // Reinitialize map grid with existing data
            this.initializeMapGrid();

            // Copy existing data
            const minRows = Math.min(oldMapGrid.length, this.mapGrid.length);
            for (let y = 0; y < minRows; y++) {
                const minCols = Math.min(oldMapGrid[y].length, this.mapGrid[y].length);
                for (let x = 0; x < minCols; x++) {
                    this.mapGrid[y][x] = oldMapGrid[y][x];
                }
            }

            // Redraw the map
            this.redrawEntireMap();
        }, 300);
    }

    /**
     * Tworzy siatke mapy
     */
    private initializeMapGrid(): void {
        // tworzenie arraya z pustymi polami
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

    /**
     * Laduje obrazek z teksturami
     */
    private loadSpritesheet(): void {
        this.spritesheet = new Image();
        this.spritesheet.src = './images/sprites.png';
        this.spritesheet.onload = () => {
            this.isSpritesheetLoaded = true;
            this.canvasManager.setSpritesheet(this.spritesheet, this.spritesheetRows, this.spritesheetCols);
            this.redrawEntireMap();
        };
        this.spritesheet.onerror = () => {
            console.error("Błąd ładowania spriteshita");
        };
    }

    /**
     * Ustawia teksture na wybranych blokach
     */
    public setCurrentTexture(texture: string): void {
        if (this.selectedBlocks.size === 0 || !this.isSpritesheetLoaded) return;
        // zmiana tekstury na wybranych blokach
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

    /**
     * Eksportuje mape
     */
    public exportMap(): string[][] {
        return this.mapGrid; // eksport mapy
    }

    /**
     * Czyści całą mapę
     */
    public clearMap(): void {
        // czyszczenie calej mapy
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

    /**
     * Wstawia teksture na mapie
     */
    public placeTextureInternal(gridX: number, gridY: number, textureId: string): void {
        // wstawianie tekstury na mapie
        if (this.isValidCoordinate(gridX, gridY)) {
            this.mapGrid[gridY][gridX] = textureId;
            this.canvasManager.redrawBlock(gridX, gridY, textureId);
            if (this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.highlightBlock(gridX, gridY);
            }
        }
    }

    /**
     * Rysuje całą mapę
     */
    public redrawEntireMap(): void {
        // rysowanie calej mapy
        this.canvasManager.redrawEntireMap(this.mapGrid);
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.highlightBlock(x, y);
            }
        });
    }

    /**
     * Zaznacza lub odznacza blok
     */
    public toggleBlockSelection(gridX: number, gridY: number, multiSelect: boolean): void {
        // zaznaczanie blokow
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

    /**
     * Tymczasowe podświetlenie bloku
     */
    public highlightBlockTemporary(gridX: number, gridY: number): void {
        // tymczasowe podswietlenie bloku
        if (this.isValidCoordinate(gridX, gridY)) {
            if (!this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.highlightBlock(gridX, gridY);
            }
        }
    }

    /**
     * Usuwa tymczasowe podświetlenie
     */
    public unhighlightBlockTemporary(gridX: number, gridY: number): void {
        // usuwanie tymczasowego podswietlenia
        if (this.isValidCoordinate(gridX, gridY)) {
            if (!this.selectedBlocks.has(`${gridX},${gridY}`)) {
                this.canvasManager.redrawBlock(gridX, gridY, this.mapGrid[gridY][gridX]);
            }
        }
    }

    /**
     * Zaznacza prostokąt bloków
     */
    public selectBlocksInArea(minGridX: number, minGridY: number, maxGridX: number, maxGridY: number, multiSelect: boolean): void {
        // zaznaczanie prostokata blokow
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

    /**
     * Usuwa wszystkie podświetlenia
     */
    private clearAllHighlights(): void {
        // usuwanie wszystkich podswietlen
        for (const blockKey of this.selectedBlocks) {
            const [x, y] = blockKey.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
            }
        }
    }

    /**
     * Zaznacz wszystko
     */
    public selectAll(): void {
        // zaznacz wszystko
        this.clearSelection();
        for (let y = 0; y < this.mapGrid.length; y++) {
            for (let x = 0; x < this.mapGrid[0].length; x++) {
                const blockKey = `${x},${y}`;
                this.selectedBlocks.add(blockKey);
                this.canvasManager.highlightBlock(x, y);
            }
        }
    }

    /**
     * Czyści zaznaczenie
     */
    private clearSelection(): void {
        // czyszczenie zaznaczenia
        this.selectedBlocks.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (this.isValidCoordinate(x, y)) {
                this.canvasManager.redrawBlock(x, y, this.mapGrid[y][x]);
            }
        });
        this.selectedBlocks.clear();
    }

    /**
     * Wytnij zaznaczenie
     */
    public cutSelection(): void {
        // wytnij zaznaczenie
        if (this.selectedBlocks.size === 0) return;
        this.copySelection();
        this.deleteSelectedBlocks();
    }

    /**
     * Kopiuje zaznaczenie do schowka
     */
    public copySelection(): void {
        // kopiowanie zaznaczenia do schowka
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

    /**
     * Wkleja ze schowka
     */
    public pasteSelection(): void {
        // wklejanie ze schowka
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

    /**
     * Usuwa zaznaczone bloki
     */
    public deleteSelectedBlocks(): void {
        // usuwanie zaznaczonych blokow
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

    /**
     * Cofanie
     */
    public undo(): void {
        // cofanie
        this.actionManager.undo();
        this.clearSelection();
    }

    /**
     * Ponowne wykonanie
     */
    public redo(): void {
        // ponowne wykonanie
        this.actionManager.redo();
        this.clearSelection();
    }

    /**
     * Zapisuje do pliku
     */
    public saveToFile(): void {
        // zapisz do pliku
        const saveData: MapSaveData = {
            version: 1,
            width: this.mapGrid[0]?.length || 0,
            height: this.mapGrid.length,
            tileSize: this.tileSize,
            grid: this.mapGrid
        };
        this.fileManager.saveToFile(saveData);
    }

    /**
     * Wczytuje z pliku
     */
    public async loadFromFile(): Promise<void> {
        // wczytaj z pliku
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
            console.error("Operacja ładowania nie powiodła się lub została anulowana:", error);
            alert(`Ładowanie nie powiodło się: ${error instanceof Error ? error.message : error}`);
        }
    }

    /**
     * Nadpisuje mapę danymi z pliku
     */
    private applyLoadedData(data: MapSaveData): void {
        // nadpisanie mapy danymi z pliku
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

    /**
     * Tworzy menu kontekstowe
     */
    public populateContextMenu(contextMenu: HTMLDivElement): void {
        // menu kontekstowe
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

    /**
     * Sprawdza czy wspolrzedne sa ok
     */
    public isValidCoordinate(gridX: number, gridY: number): boolean {
        // sprawdzanie czy wspolrzedne sa ok
        return gridY >= 0 && gridY < this.mapGrid.length &&
            gridX >= 0 && gridX < (this.mapGrid[0]?.length || 0);
    }

    /**
     * Automatyczne przesuwanie zaznaczenia
     */
    private autoPositionSelection(): void {
        // automatyczne przesuwanie zaznaczenia
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
