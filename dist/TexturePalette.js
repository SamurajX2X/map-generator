export class TexturePalette {
    constructor(container) {
        this.selectedTexture = null;
        this.callback = null;
        this.tileWidth = 0;
        this.tileHeight = 0;
        this.rows = 32;
        this.cols = 20;
        this.canvases = [];
        this.selectedCanvas = null;
        this.scaleFactor = 0.65; // Significantly increased to fill the container better
        this.container = container;
        this.loadTextures();
    }
    loadTextures() {
        this.textureImage = new Image();
        this.textureImage.src = './images/sprites.png';
        this.textureImage.onload = () => {
            this.tileWidth = this.textureImage.width / this.rows;
            this.tileHeight = this.textureImage.height / this.cols;
            // Create a grid container for our small canvases
            const gridContainer = document.createElement('div');
            gridContainer.className = 'texture-grid-container';
            this.container.appendChild(gridContainer);
            // Create individual small canvases for each texture tile
            for (let j = 0; j < this.cols; j++) {
                for (let i = 0; i < this.rows; i++) {
                    // Create a small canvas for this tile
                    const canvas = document.createElement('canvas');
                    canvas.width = this.tileWidth * this.scaleFactor;
                    canvas.height = this.tileHeight * this.scaleFactor;
                    canvas.className = 'texture-tile';
                    canvas.dataset.x = i.toString();
                    canvas.dataset.y = j.toString();
                    const ctx = canvas.getContext('2d');
                    // Draw just this tile from the spritesheet onto the small canvas
                    ctx.drawImage(this.textureImage, i * this.tileWidth, // Source X in spritesheet
                    j * this.tileHeight, // Source Y in spritesheet
                    this.tileWidth, // Source width
                    this.tileHeight, // Source height
                    0, // Dest X (0 since this is a new canvas)
                    0, // Dest Y (0 since this is a new canvas)
                    canvas.width, // Dest width (scaled)
                    canvas.height // Dest height (scaled)
                    );
                    // Add border to each tile
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(0, 0, canvas.width, canvas.height);
                    // Store reference to this canvas
                    this.canvases.push(canvas);
                    // Add click event to select this texture
                    canvas.addEventListener('click', () => {
                        this.selectTexture(i, j, canvas);
                    });
                    // Add directly to the container
                    gridContainer.appendChild(canvas);
                }
            }
        };
    }
    selectTexture(i, j, canvas) {
        // Remove highlight from previously selected canvas
        if (this.selectedCanvas) {
            const prevCtx = this.selectedCanvas.getContext('2d');
            const prevI = parseInt(this.selectedCanvas.dataset.x || '0');
            const prevJ = parseInt(this.selectedCanvas.dataset.y || '0');
            // Redraw the previous canvas without highlight
            prevCtx.clearRect(0, 0, this.selectedCanvas.width, this.selectedCanvas.height);
            prevCtx.drawImage(this.textureImage, prevI * this.tileWidth, prevJ * this.tileHeight, this.tileWidth, this.tileHeight, 0, 0, this.selectedCanvas.width, this.selectedCanvas.height);
            // Add normal border
            prevCtx.strokeStyle = '#ccc';
            prevCtx.lineWidth = 1;
            prevCtx.strokeRect(0, 0, this.selectedCanvas.width, this.selectedCanvas.height);
        }
        // Add highlight to the newly selected canvas
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        // Update selection state
        this.selectedCanvas = canvas;
        this.selectedTexture = `${i}-${j}`;
        // Call the callback if set
        if (this.callback) {
            this.callback(this.selectedTexture);
        }
    }
    onTextureSelect(callback) {
        this.callback = callback;
    }
}
