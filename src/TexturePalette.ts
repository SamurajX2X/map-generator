export class TexturePalette {
    private container: HTMLDivElement;
    private selectedTexture: string | null = null;
    private callback: ((texture: string) => void) | null = null;
    private canvas: HTMLCanvasElement;
    private tileWidth: number = 0;
    private tileHeight: number = 0;
    private rows: number = 32;
    private cols: number = 20;

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.loadTextures();
    }

    private loadTextures() {
        const textures = new Image();
        textures.src = 'images/sprites.png';

        textures.onload = () => {
            this.tileWidth = textures.width / this.rows;
            this.tileHeight = textures.height / this.cols;

            this.canvas.width = textures.width;
            this.canvas.height = textures.height;

            const ctx = this.canvas.getContext('2d')!;
            ctx.drawImage(textures, 0, 0);
            // this.drawGrid(ctx);

            // this.canvas.addEventListener('click', (e) => {
            //     const rect = this.canvas.getBoundingClientRect();
            //     const x = e.clientX - rect.left;
            //     const y = e.clientY - rect.top;

            //     const i = Math.floor(x / this.tileWidth);
            //     const j = Math.floor(y / this.tileHeight);

            //     // this.clearSelection(ctx);
            //     // this.highlightTile(ctx, i, j);
            //     this.selectedTexture = `${i}-${j}`;

            //     if (this.callback) {
            //         this.callback(this.selectedTexture);
            //     }
            // });
        };
    }



    // private clearSelection(ctx: CanvasRenderingContext2D) {
    //     const textures = new Image();
    //     textures.src = 'images/sprites.png';
    //     ctx.drawImage(textures, 0, 0);
    //     this.drawGrid(ctx);
    // }

    // private highlightTile(ctx: CanvasRenderingContext2D, i: number, j: number) {
    //     ctx.strokeStyle = '#0066ff';
    //     ctx.lineWidth = 2;
    //     ctx.strokeRect(
    //         i * this.tileWidth,
    //         j * this.tileHeight,
    //         this.tileWidth,
    //         this.tileHeight
    //     );
    // }

    public onTextureSelect(callback: (texture: string) => void) {
        this.callback = callback;
    }
}
