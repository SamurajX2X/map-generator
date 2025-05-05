export class CanvasManager {
    private ctx: CanvasRenderingContext2D;
    private spritesheet!: HTMLImageElement;
    private spritesheetRows: number = 32;
    private spritesheetCols: number = 20;
    private isSpritesheetLoaded: boolean = false;

    constructor(
        private canvas: HTMLCanvasElement,
        private tileSize: number
    ) {
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("Failed to get 2D context from canvas");
        }
        this.ctx = context;
    }

    public setSpritesheet(spritesheet: HTMLImageElement, rows: number, cols: number): void {
        this.spritesheet = spritesheet;
        this.spritesheetRows = rows;
        this.spritesheetCols = cols;
        this.isSpritesheetLoaded = true;
    }

    public updateTileSize(newTileSize: number): void {
        this.tileSize = newTileSize;
    }

    public clearCanvas(): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

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
            console.error(`Error drawing texture ${textureId} at ${gridX},${gridY}:`, error);
        }
    }

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

    public clearCell(gridX: number, gridY: number): void {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(
            gridX * this.tileSize,
            gridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

    public redrawBlock(gridX: number, gridY: number, textureId: string | null): void {
        this.clearCell(gridX, gridY);
        if (textureId) {
            this.drawTexture(gridX, gridY, textureId);
        }
        this.drawCellGrid(gridX, gridY);
    }

    public highlightBlock(gridX: number, gridY: number): void {
        this.ctx.fillStyle = 'rgba(0, 102, 255, 0.3)';
        this.ctx.fillRect(
            gridX * this.tileSize,
            gridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );
    }

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
