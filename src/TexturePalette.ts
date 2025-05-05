export class TexturePalette {
    private container: HTMLDivElement;
    private selectedTexture: string | null = null;
    private callback: ((texture: string) => void) | null = null;
    private textureImage!: HTMLImageElement;
    private tileWidth: number = 0;
    private tileHeight: number = 0;
    private rows: number = 32;
    private cols: number = 20;
    private canvases: HTMLCanvasElement[] = [];
    private selectedCanvas: HTMLCanvasElement | null = null;
    private scaleFactor: number = 0.65;

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.loadTextures();
    }

    private loadTextures() {
        this.textureImage = new Image();
        this.textureImage.src = './images/sprites.png';

        this.textureImage.onload = () => {
            this.tileWidth = this.textureImage.width / this.rows;
            this.tileHeight = this.textureImage.height / this.cols;

            const gridContainer = document.createElement('div');
            gridContainer.className = 'texture-grid-container'; // Use class from CSS
            this.container.appendChild(gridContainer);

            for (let j = 0; j < this.cols; j++) {
                for (let i = 0; i < this.rows; i++) {
                    const canvas = document.createElement('canvas');
                    // Calculate scaled size, ensuring it's at least 1px
                    const scaledWidth = Math.max(1, Math.floor(this.tileWidth * this.scaleFactor));
                    const scaledHeight = Math.max(1, Math.floor(this.tileHeight * this.scaleFactor));
                    canvas.width = scaledWidth;
                    canvas.height = scaledHeight;
                    canvas.className = 'texture-tile'; // Use class from CSS
                    canvas.dataset.x = i.toString();
                    canvas.dataset.y = j.toString();
                    canvas.title = `Texture ${i}-${j}`; // Add tooltip

                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;

                    // Ensure crisp rendering
                    ctx.imageSmoothingEnabled = false;

                    ctx.drawImage(
                        this.textureImage,
                        i * this.tileWidth,
                        j * this.tileHeight,
                        this.tileWidth,
                        this.tileHeight,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    // No need to draw border here, CSS handles it
                    // ctx.strokeStyle = '#444'; // Match dark theme if needed, but CSS preferred
                    // ctx.lineWidth = 1;
                    // ctx.strokeRect(0, 0, canvas.width, canvas.height);

                    this.canvases.push(canvas);

                    canvas.addEventListener('click', () => {
                        this.selectTexture(i, j, canvas);
                    });

                    gridContainer.appendChild(canvas);
                }
            }
        };
        this.textureImage.onerror = () => {
            console.error("Failed to load texture spritesheet.");
            // Optionally display an error message to the user
        };
    }

    private selectTexture(i: number, j: number, canvas: HTMLCanvasElement) {
        // Remove 'selected' class from previously selected canvas
        if (this.selectedCanvas) {
            this.selectedCanvas.classList.remove('selected');
            // No need to redraw border, CSS handles removal
        }

        // Add 'selected' class to the newly selected canvas
        canvas.classList.add('selected');
        this.selectedCanvas = canvas;
        this.selectedTexture = `${i}-${j}`;

        if (this.callback) {
            this.callback(this.selectedTexture);
        }
    }

    public onTextureSelect(callback: (texture: string) => void) {
        this.callback = callback;
    }
}