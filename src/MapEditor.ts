export class MapEditor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private currentTexture: string | null = null;
    private tileSize: number = 32;
    private mapGrid: string[][] = [];
    private spritesheet!: HTMLImageElement;
    private spritesheetRows: number = 32;
    private spritesheetCols: number = 20;
    private isSpritesheetLoaded: boolean = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.initializeCanvas();
        this.bindEvents();
        this.loadSpritesheet();
        this.initializeMapGrid();
    }

    private initializeCanvas() {
        // Make canvas size match its container to avoid scrollbars
        const canvasContainer = this.canvas.parentElement;
        if (canvasContainer) {
            // Use a size that's a multiple of tileSize for clean grid
            const containerWidth = canvasContainer.clientWidth;
            const containerHeight = canvasContainer.clientHeight || 600;

            // Calculate dimensions that are multiples of tileSize
            this.canvas.width = Math.floor(containerWidth / this.tileSize) * this.tileSize;
            this.canvas.height = Math.floor(containerHeight / this.tileSize) * this.tileSize;
        } else {
            // Fallback sizes if no container
            this.canvas.width = 800;
            this.canvas.height = 600;
        }

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }

    private initializeMapGrid() {
        const rows = Math.floor(this.canvas.height / this.tileSize);
        const cols = Math.floor(this.canvas.width / this.tileSize);

        this.mapGrid = Array(rows).fill(null).map(() =>
            Array(cols).fill("")
        );
    }

    private loadSpritesheet() {
        this.spritesheet = new Image();
        this.spritesheet.src = './images/sprites.png';
        this.spritesheet.onload = () => {
            this.isSpritesheetLoaded = true;
        };
    }

    private bindEvents() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    private drawGrid() {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
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

    private handleClick(e: MouseEvent) {
        if (!this.currentTexture || !this.isSpritesheetLoaded) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);

        if (gridY < this.mapGrid.length && gridX < this.mapGrid[0].length) {
            this.mapGrid[gridY][gridX] = this.currentTexture;
            this.drawTexture(gridX, gridY, this.currentTexture);
        }
    }

    private drawTexture(gridX: number, gridY: number, textureId: string) {
        const [spriteX, spriteY] = textureId.split('-').map(Number);

        const spriteTileWidth = this.spritesheet.width / this.spritesheetRows;
        const spriteTileHeight = this.spritesheet.height / this.spritesheetCols;

        // Clear the tile
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(
            gridX * this.tileSize,
            gridY * this.tileSize,
            this.tileSize,
            this.tileSize
        );

        // Draw the texture
        this.ctx.drawImage(
            this.spritesheet,                    // Spritesheet image
            spriteX * spriteTileWidth,           // Source X (fixed variable name)
            spriteY * spriteTileHeight,          // Source Y
            spriteTileWidth,                     // Source width
            spriteTileHeight,                    // Source height
            gridX * this.tileSize,               // Destination X
            gridY * this.tileSize,               // Destination Y
            this.tileSize,                       // Destination width
            this.tileSize                        // Destination height
        );

        // Redraw the grid lines for this cell
        this.drawCellGrid(gridX, gridY);
    }

    private drawCellGrid(gridX: number, gridY: number) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;

        // Draw horizontal lines
        this.ctx.beginPath();
        this.ctx.moveTo(gridX * this.tileSize, gridY * this.tileSize);
        this.ctx.lineTo((gridX + 1) * this.tileSize, gridY * this.tileSize);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(gridX * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.lineTo((gridX + 1) * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.stroke();

        // Draw vertical lines
        this.ctx.beginPath();
        this.ctx.moveTo(gridX * this.tileSize, gridY * this.tileSize);
        this.ctx.lineTo(gridX * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo((gridX + 1) * this.tileSize, gridY * this.tileSize);
        this.ctx.lineTo((gridX + 1) * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.stroke();
    }

    public setCurrentTexture(texture: string) {
        this.currentTexture = texture;
    }

    // Method to export the map data if needed
    public exportMap() {
        return this.mapGrid;
    }

    public clearMap() {
        // Clear the map grid data
        for (let y = 0; y < this.mapGrid.length; y++) {
            for (let x = 0; x < this.mapGrid[y].length; x++) {
                this.mapGrid[y][x] = "";
            }
        }

        // Clear the canvas
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }
}
