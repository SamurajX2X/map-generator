/**
 * Zarzadza rysowaniem na canvasie
 * @param canvas - element canvas
 * @param tileSize - rozmiar kafelka
 */
export class CanvasManager {
    /**
     * Tworzy managera canvasu
     */
    constructor(canvas, tileSize) {
        this.canvas = canvas;
        this.tileSize = tileSize;
        this.spritesheetRows = 32; // wiersze w spritesheet
        this.spritesheetCols = 20; // kolumny w spritesheet
        this.isSpritesheetLoaded = false; // czy zaladowano spritesheet
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error("Brak kontekstu 2d na canvasie");
        }
        this.ctx = context;
    }
    /**
     * Ustawia spritesheet
     */
    setSpritesheet(spritesheet, rows, cols) {
        this.spritesheet = spritesheet;
        this.spritesheetRows = rows;
        this.spritesheetCols = cols;
        this.isSpritesheetLoaded = true;
    }
    /**
     * Zmienia rozmiar kafelka
     */
    updateTileSize(newTileSize) {
        this.tileSize = newTileSize;
    }
    /**
     * Czyści cały canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    /**
     * Rysuje siatkę
     */
    drawGrid() {
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
    drawTexture(gridX, gridY, textureId) {
        if (!this.isSpritesheetLoaded || !textureId)
            return;
        try {
            const [spriteX, spriteY] = textureId.split('-').map(Number);
            if (isNaN(spriteX) || isNaN(spriteY))
                return;
            const spriteTileWidth = this.spritesheet.width / this.spritesheetRows;
            const spriteTileHeight = this.spritesheet.height / this.spritesheetCols;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
            this.ctx.drawImage(this.spritesheet, spriteX * spriteTileWidth, spriteY * spriteTileHeight, spriteTileWidth, spriteTileHeight, gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
        }
        catch (error) {
            console.error("Błąd rysowania tekstury", textureId, "na", gridX + "," + gridY + ":", error);
        }
    }
    /**
     * Rysuje ramkę wokół komórki
     */
    drawCellGrid(gridX, gridY) {
        this.ctx.strokeStyle = '#CCCCCC';
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
    }
    /**
     * Czyści komórkę
     */
    clearCell(gridX, gridY) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
    }
    /**
     * Rysuje blok (czyści, rysuje teksturę, rysuje ramkę)
     */
    redrawBlock(gridX, gridY, textureId) {
        this.clearCell(gridX, gridY);
        if (textureId) {
            this.drawTexture(gridX, gridY, textureId);
        }
        this.drawCellGrid(gridX, gridY);
    }
    /**
     * Podświetla blok
     */
    highlightBlock(gridX, gridY) {
        this.ctx.fillStyle = 'rgba(0, 102, 255, 0.3)';
        this.ctx.fillRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
    }
    /**
     * Rysuje całą mapę
     */
    redrawEntireMap(mapGrid) {
        this.clearCanvas();
        for (let y = 0; y < mapGrid.length; y++) {
            for (let x = 0; x < mapGrid[y].length; x++) {
                this.redrawBlock(x, y, mapGrid[y][x]);
            }
        }
        this.drawGrid();
    }
}
