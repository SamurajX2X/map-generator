export class MapEditor {
    constructor(canvas) {
        this.currentTexture = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.initializeCanvas();
        this.bindEvents();
    }
    initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.drawGrid();
    }
    bindEvents() {
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }
    drawGrid() {
    }
    handleClick(e) {
    }
    setCurrentTexture(texture) {
        this.currentTexture = texture;
    }
}
