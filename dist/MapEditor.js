export class MapEditor {
    constructor(canvas) {
        this.currentTexture = null;
        this.tileSize = 32;
        this.mapGrid = [];
        this.spritesheetRows = 32;
        this.spritesheetCols = 20;
        this.isSpritesheetLoaded = false;
        this.selectedBlocks = new Set();
        this.isDragging = false;
        this.selectionOverlay = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.initializeCanvas();
        this.bindEvents();
        this.loadSpritesheet();
        this.initializeMapGrid();
    }
    initializeCanvas() {
        const canvasContainer = this.canvas.parentElement;
        if (canvasContainer) {
            const containerWidth = canvasContainer.clientWidth;
            const containerHeight = canvasContainer.clientHeight || 600;
            this.canvas.width = Math.floor(containerWidth / this.tileSize) * this.tileSize;
            this.canvas.height = Math.floor(containerHeight / this.tileSize) * this.tileSize;
        }
        else {
            this.canvas.width = 800;
            this.canvas.height = 600;
        }
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }
    initializeMapGrid() {
        const rows = Math.floor(this.canvas.height / this.tileSize);
        const cols = Math.floor(this.canvas.width / this.tileSize);
        this.mapGrid = Array(rows).fill(null).map(() => Array(cols).fill(""));
    }
    loadSpritesheet() {
        this.spritesheet = new Image();
        this.spritesheet.src = './images/sprites.png';
        this.spritesheet.onload = () => {
            this.isSpritesheetLoaded = true;
        };
    }
    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (e.button === 0 &&
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom) {
            this.dragStartX = e.clientX - rect.left;
            this.dragStartY = e.clientY - rect.top;
            this.isDragging = true;
            // if (!e.ctrlKey) {
            //     this.clearAllHighlights();
            //     this.selectedBlocks.clear();
            // }
            this.selectionOverlay = document.createElement('div');
            this.selectionOverlay.style.position = 'absolute';
            this.selectionOverlay.style.border = '2px dashed #0078d7';
            this.selectionOverlay.style.backgroundColor = 'rgba(0, 120, 215, 0.1)';
            this.selectionOverlay.style.pointerEvents = 'none';
            this.selectionOverlay.style.zIndex = '1000';
            this.selectionOverlay.style.left = `${e.clientX}px`;
            this.selectionOverlay.style.top = `${e.clientY}px`;
            this.selectionOverlay.style.width = '0px';
            this.selectionOverlay.style.height = '0px';
            document.body.appendChild(this.selectionOverlay);
            this.boundMouseMove = this.handleMouseMove.bind(this);
            this.boundMouseUp = this.handleMouseUp.bind(this);
            document.addEventListener('mousemove', this.boundMouseMove);
            document.addEventListener('mouseup', this.boundMouseUp);
            e.preventDefault();
        }
    }
    handleMouseMove(e) {
        if (this.isDragging && this.selectionOverlay) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = Math.max(0, Math.min(e.clientX - rect.left, this.canvas.width));
            const currentY = Math.max(0, Math.min(e.clientY - rect.top, this.canvas.height));
            const left = Math.min(this.dragStartX, currentX) + rect.left;
            const top = Math.min(this.dragStartY, currentY) + rect.top;
            const width = Math.abs(currentX - this.dragStartX);
            const height = Math.abs(currentY - this.dragStartY);
            this.selectionOverlay.style.left = `${left}px`;
            this.selectionOverlay.style.top = `${top}px`;
            this.selectionOverlay.style.width = `${width}px`;
            this.selectionOverlay.style.height = `${height}px`;
        }
    }
    handleMouseUp(e) {
        if (this.isDragging && this.selectionOverlay) {
            document.body.removeChild(this.selectionOverlay);
            const rect = this.canvas.getBoundingClientRect();
            const endX = Math.max(0, Math.min(e.clientX - rect.left, this.canvas.width));
            const endY = Math.max(0, Math.min(e.clientY - rect.top, this.canvas.height));
            const minGridX = Math.floor(Math.min(this.dragStartX, endX) / this.tileSize);
            const maxGridX = Math.floor(Math.max(this.dragStartX, endX) / this.tileSize);
            const minGridY = Math.floor(Math.min(this.dragStartY, endY) / this.tileSize);
            const maxGridY = Math.floor(Math.max(this.dragStartY, endY) / this.tileSize);
            // Select all tiles within the dragged area
            for (let y = minGridY; y <= maxGridY; y++) {
                for (let x = minGridX; x <= maxGridX; x++) {
                    if (y < this.mapGrid.length && x < this.mapGrid[0].length) {
                        const blockKey = `${x},${y}`;
                        this.selectedBlocks.add(blockKey);
                        this.highlightSelectedBlock(x, y);
                    }
                }
            }
            const selectedBlocksArray = Array.from(this.selectedBlocks);
            console.log("Selected Blocks:", selectedBlocksArray);
            this.isDragging = false;
            this.selectionOverlay = null;
            document.removeEventListener('mousemove', this.boundMouseMove);
            document.removeEventListener('mouseup', this.boundMouseUp);
        }
    }
    handleClick(e) {
        if (this.isDragging)
            return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const gridX = Math.floor(x / this.tileSize);
        const gridY = Math.floor(y / this.tileSize);
        if (gridY < this.mapGrid.length && gridX < this.mapGrid[0].length) {
            const blockKey = `${gridX},${gridY}`;
            if (!e.ctrlKey) {
                this.clearAllHighlights();
                this.selectedBlocks.clear();
            }
            if (this.selectedBlocks.has(blockKey)) {
                this.selectedBlocks.delete(blockKey);
                this.redrawBlock(gridX, gridY);
            }
            else {
                this.selectedBlocks.add(blockKey);
                this.highlightSelectedBlock(gridX, gridY);
            }
        }
    }
    drawGrid() {
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
    clearAllHighlights() {
        for (const blockKey of this.selectedBlocks) {
            const [x, y] = blockKey.split(',').map(Number);
            this.redrawBlock(x, y);
        }
    }
    redrawBlock(gridX, gridY) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
        const textureId = this.mapGrid[gridY][gridX];
        if (textureId) {
            const [spriteX, spriteY] = textureId.split('-').map(Number);
            const spriteTileWidth = this.spritesheet.width / this.spritesheetRows;
            const spriteTileHeight = this.spritesheet.height / this.spritesheetCols;
            this.ctx.drawImage(this.spritesheet, spriteX * spriteTileWidth, spriteY * spriteTileHeight, spriteTileWidth, spriteTileHeight, gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
        }
        this.drawCellGrid(gridX, gridY);
    }
    highlightSelectedBlock(gridX, gridY) {
        this.ctx.fillStyle = 'rgba(0, 102, 255, 0.2)';
        this.ctx.fillRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
        this.drawCellGrid(gridX, gridY);
    }
    setCurrentTexture(texture) {
        if (this.selectedBlocks.size > 0 && this.isSpritesheetLoaded) {
            for (const blockKey of this.selectedBlocks) {
                const [gridX, gridY] = blockKey.split(',').map(Number);
                if (gridY < this.mapGrid.length && gridX < this.mapGrid[0].length) {
                    this.mapGrid[gridY][gridX] = texture;
                    this.drawTexture(gridX, gridY, texture);
                }
            }
            this.selectedBlocks.clear();
        }
    }
    drawTexture(gridX, gridY, textureId) {
        const [spriteX, spriteY] = textureId.split('-').map(Number);
        const spriteTileWidth = this.spritesheet.width / this.spritesheetRows;
        const spriteTileHeight = this.spritesheet.height / this.spritesheetCols;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
        this.ctx.drawImage(this.spritesheet, spriteX * spriteTileWidth, spriteY * spriteTileHeight, spriteTileWidth, spriteTileHeight, gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
        this.drawCellGrid(gridX, gridY);
    }
    drawCellGrid(gridX, gridY) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(gridX * this.tileSize, gridY * this.tileSize);
        this.ctx.lineTo((gridX + 1) * this.tileSize, gridY * this.tileSize);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(gridX * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.lineTo((gridX + 1) * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(gridX * this.tileSize, gridY * this.tileSize);
        this.ctx.lineTo(gridX * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo((gridX + 1) * this.tileSize, gridY * this.tileSize);
        this.ctx.lineTo((gridX + 1) * this.tileSize, (gridY + 1) * this.tileSize);
        this.ctx.stroke();
    }
    exportMap() {
        return this.mapGrid;
    }
    clearMap() {
        for (let y = 0; y < this.mapGrid.length; y++) {
            for (let x = 0; x < this.mapGrid[y].length; x++) {
                this.mapGrid[y][x] = "";
            }
        }
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }
    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedBlocks.size > 0) {
            for (const blockKey of this.selectedBlocks) {
                const [gridX, gridY] = blockKey.split(',').map(Number);
                if (gridY < this.mapGrid.length && gridX < this.mapGrid[0].length) {
                    this.mapGrid[gridY][gridX] = "";
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(gridX * this.tileSize, gridY * this.tileSize, this.tileSize, this.tileSize);
                    this.highlightSelectedBlock(gridX, gridY);
                }
            }
            console.log("Cleared textures from selected blocks");
            this.clearAllHighlights();
            this.selectedBlocks.clear();
        }
    }
}
