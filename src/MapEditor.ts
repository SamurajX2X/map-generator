export class MapEditor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private currentTexture: string | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.initializeCanvas();
        this.bindEvents();
    }

    private initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.drawGrid();
    }

    private bindEvents() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    private drawGrid() {
    }

    private handleClick(e: MouseEvent) {
    }

    public setCurrentTexture(texture: string) {
        this.currentTexture = texture;
    }
}
