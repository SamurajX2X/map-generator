/**
 * Paleta tekstur do wyboru
 */
export class TexturePalette {
    private container: HTMLDivElement; // kontener
    private selectedTexture: string | null = null; // wybrana tekstura
    private callback: ((texture: string) => void) | null = null; // callback po wyborze
    private textureImage!: HTMLImageElement; // obrazek z teksturami
    private tileWidth: number = 0; // szerokosc kafelka
    private tileHeight: number = 0; // wysokosc kafelka
    private rows: number = 32; // wiersze
    private cols: number = 20; // kolumny
    private canvases: HTMLCanvasElement[] = []; // kafelki
    private selectedCanvas: HTMLCanvasElement | null = null; // wybrany canvas
    private scaleFactor: number = 0.65; // skala

    /**
     * Tworzy palete tekstur
     */
    constructor(container: HTMLDivElement) {
        this.container = container;
        this.loadTextures();
    }

    /**
     * Laduje tekstury
     */
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
                    const scaledWidth = Math.max(1, Math.floor(this.tileWidth * this.scaleFactor));
                    const scaledHeight = Math.max(1, Math.floor(this.tileHeight * this.scaleFactor));
                    canvas.width = scaledWidth;
                    canvas.height = scaledHeight;
                    canvas.className = 'texture-tile';
                    canvas.dataset.x = i.toString();
                    canvas.dataset.y = j.toString();
                    canvas.title = `Texture ${i}-${j}`;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;
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
                    this.canvases.push(canvas);
                    canvas.addEventListener('click', () => {
                        this.selectTexture(i, j, canvas);
                    });
                    gridContainer.appendChild(canvas);
                }
            }
        };
        this.textureImage.onerror = () => {
            console.error("Błąd ładowania spriteshita.");
        };
    }

    /**
     * Zaznacza teksture
     */
    private selectTexture(i: number, j: number, canvas: HTMLCanvasElement) {
        if (this.selectedCanvas) {
            this.selectedCanvas.classList.remove('selected');
        }
        canvas.classList.add('selected');
        this.selectedCanvas = canvas;
        this.selectedTexture = `${i}-${j}`;
        if (this.callback) {
            this.callback(this.selectedTexture);
        }
    }

    /**
     * Ustawia callback po wyborze tekstury
     */
    public onTextureSelect(callback: (texture: string) => void) {
        this.callback = callback;
    }
}