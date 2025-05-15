/**
 * Paleta tekstur do wyboru
 */
export class TexturePalette {
    /**
     * Tworzy palete tekstur
     */
    constructor(container) {
        this.selectedTexture = null; // wybrana tekstura
        this.callback = null; // callback po wyborze
        this.tileWidth = 0; // szerokosc kafelka
        this.tileHeight = 0; // wysokosc kafelka
        this.rows = 32; // wiersze
        this.cols = 20; // kolumny
        this.canvases = []; // kafelki
        this.selectedCanvas = null; // wybrany canvas
        this.scaleFactor = 0.65; // skala
        this.container = container;
        this.loadTextures();
    }
    /**
     * Laduje tekstury
     */
    loadTextures() {
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
                    if (!ctx)
                        continue;
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(this.textureImage, i * this.tileWidth, j * this.tileHeight, this.tileWidth, this.tileHeight, 0, 0, canvas.width, canvas.height);
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
    selectTexture(i, j, canvas) {
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
    onTextureSelect(callback) {
        this.callback = callback;
    }
}
