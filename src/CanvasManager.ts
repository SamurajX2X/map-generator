/**
 * Zarzadza rysowaniem na canvasie
 * @param canvas - element canvas
 * @param tileSize - rozmiar kafelka
 */
export class CanvasManager {
    private ctx: CanvasRenderingContext2D; // kontekst 2d
    private spritesheet!: HTMLImageElement; // obrazek z teksturami
    private spritesheetRows: number = 32; // wiersze w spritesheet
    private spritesheetCols: number = 20; // kolumny w spritesheet
    private isSpritesheetLoaded: boolean = false; // czy zaladowano spritesheet

    /**
     * Tworzy managera canvasu
     */
    constructor(
        private canvas: HTMLCanvasElement,
        private tileSize: number
    ) {
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("Brak kontekstu 2d na canvasie");
        }
        this.ctx = context;
    }

    /**
     * Ustawia spritesheet
     */
    public setSpritesheet(spritesheet: HTMLImageElement, rows: number, cols: number): void {
        this.spritesheet = spritesheet;
        this.spritesheetRows = rows;
        this.spritesheetCols = cols;
        this.isSpritesheetLoaded = true;
    }

    /**
     * Zmienia rozmiar kafelka
     */
    public updateTileSize(newTileSize: number): void {
        this.tileSize = newTileSize;
    }

    /**
     * Czyści cały canvas
     */
    public clearCanvas(): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Rysuje siatkę
     */
    public drawGrid(): void {
        this.ctx.strokeStyle = '#CCCCCC';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.canvas.width; x += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += this.tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Rysuje teksturę na danym polu
     */
    public drawTexture(gridX: number, gridY: number, textureId: string): void {
        if (!this.isSpritesheetLoaded || !textureId) return;
        try {
            const [spriteX, spriteY] = textureId.split('-').map(Number);
            if (isNaN(spriteX) || isNaN(spriteY)) return;
            const spriteTileWidth = this.spritesheet.width / this.spritesheetRows;
            const spriteTileHeight = this.spritesheet.height / this.spritesheetCols;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(
                gridX * this.tileSize,
                gridY * this.tileSize,
                this.tileSize,
                this.tileSize
            );
            this.ctx.drawImage(
                this.spritesheet,
                spriteX * spriteTileWidth,
                spriteY * spriteTileHeight,
                spriteTileWidth,
                spriteTileHeight,
                gridX * this.tileSize,
                gridY * this.tileSize,
                this.tileSize,
                this.tileSize
            );
        } catch (error) {
            console.error("Błąd rysowania tekstury", textureId, "na", gridX + "," + gridY + ":", error);
        }
    }

    /**
     * Rysuje ramkę wokół komórki
     */
    public drawCellGrid(gridX: number, gridY: number): void {
        this.ctx.strokeStyle = '#CCCCCC';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(
            gridX * this.tileSize,
            gridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    /**
     * Czyści komórkę
     */
    public clearCell(gridX: number, gridY: number): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(
            gridX * this.tileSize,
            gridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    /**
     * Rysuje blok (czyści, rysuje teksturę, rysuje ramkę)
     */
    public redrawBlock(gridX: number, gridY: number, textureId: string | null): void {
        this.clearCell(gridX, gridY);
        if (textureId) {
            this.drawTexture(gridX, gridY, textureId);
        }
        this.drawCellGrid(gridX, gridY);
    }

    /**
     * Podświetla blok
     */
    public highlightBlock(gridX: number, gridY: number): void {
        this.ctx.fillStyle = 'rgba(0, 102, 255, 0.3)';
        this.ctx.fillRect(
            gridX * this.tileSize,
            gridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    /**
     * Rysuje całą mapę
     */
    public redrawEntireMap(mapGrid: string[][]): void {
        this.clearCanvas();
        for (let y = 0; y < mapGrid.length; y++) {
            for (let x = 0; x < mapGrid[y].length; x++) {
                this.redrawBlock(x, y, mapGrid[y][x]);
            }
        }
        this.drawGrid();
    }
}
