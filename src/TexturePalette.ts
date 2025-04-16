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

    /**
     * @param container
     */

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
            gridContainer.className = 'texture-grid-container';
            this.container.appendChild(gridContainer);

            for (let j = 0; j < this.cols; j++) {
                for (let i = 0; i < this.rows; i++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = this.tileWidth * this.scaleFactor;
                    canvas.height = this.tileHeight * this.scaleFactor;
                    canvas.className = 'texture-tile';
                    canvas.dataset.x = i.toString();
                    canvas.dataset.y = j.toString();

                    const ctx = canvas.getContext('2d')!;

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

                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(0, 0, canvas.width, canvas.height);

                    this.canvases.push(canvas);

                    canvas.addEventListener('click', () => {
                        this.selectTexture(i, j, canvas);
                    });

                    gridContainer.appendChild(canvas);
                }
            }
        };
    }

    /**
     * @param i
     * @param j
     * @param canvas
     */
    private selectTexture(i: number, j: number, canvas: HTMLCanvasElement) {
        if (this.selectedCanvas) {
            const prevCtx = this.selectedCanvas.getContext('2d')!;
            const prevI = parseInt(this.selectedCanvas.dataset.x || '0');
            const prevJ = parseInt(this.selectedCanvas.dataset.y || '0');

            prevCtx.clearRect(0, 0, this.selectedCanvas.width, this.selectedCanvas.height);
            prevCtx.drawImage(
                this.textureImage,
                prevI * this.tileWidth,
                prevJ * this.tileHeight,
                this.tileWidth,
                this.tileHeight,
                0,
                0,
                this.selectedCanvas.width,
                this.selectedCanvas.height
            );

            prevCtx.strokeStyle = '#ccc';
            prevCtx.lineWidth = 1;
            prevCtx.strokeRect(0, 0, this.selectedCanvas.width, this.selectedCanvas.height);
        }

        const ctx = canvas.getContext('2d')!;
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        this.selectedCanvas = canvas;
        this.selectedTexture = `${i}-${j}`;

        if (this.callback) {
            this.callback(this.selectedTexture);
        }
    }

    /**
     * @param callback
     */
    public onTextureSelect(callback: (texture: string) => void) {
        this.callback = callback;
    }
}