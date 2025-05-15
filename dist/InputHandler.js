/**
 * Handler do obslugi myszki i klawiatury
 * @param canvas - element canvas
 * @param edytor - glowny edytor mapy
 * @param rozmiar - rozmiar kafelka
 */
export class InputHandler {
    /**
     * Tworzy handler inputu
     * @param canvas - canvas
     * @param edytor - edytor mapy
     * @param rozmiar - rozmiar kafelka
     */
    constructor(canvas, edytor, rozmiar) {
        this.canvas = canvas;
        this.edytor = edytor;
        this.rozmiar = rozmiar;
        this.isDragging = false; // czy ciagniesz myszka
        this.zaznaczOverlay = null; // overlay do zaznaczania
        this.startX = 0; // poczatek x
        this.startY = 0; // poczatek y
        this.podswietlone = new Set(); // podswietlone bloki
        this.myszRuch = this.handleMouseMove.bind(this);
        this.myszUp = this.handleMouseUp.bind(this);
        this.bindujZdarzenia();
    }
    /**
     * Zmienia rozmiar kafelka
     * @param nowy - nowy rozmiar
     */
    zmienRozmiar(nowy) {
        this.rozmiar = nowy;
    }
    /**
     * Podpina eventy do canvasu i dokumentu
     */
    bindujZdarzenia() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('mapEditorContextMenu');
            if (menu && !menu.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    } /**
     * Sprawdza czy ctrl lub cmd (dla Macintosh)
     */
    ctrl(e) {
        return e.ctrlKey || e.metaKey; // e.metaKey dla Macintosh (Command key)
    }
    /**
     * Zwraca wspolrzedne gridu z pozycji myszki
     */
    gridXY(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        if (x < 0 || x >= this.canvas.width || y < 0 || y >= this.canvas.height) {
            return null;
        }
        return { x: Math.floor(x / this.rozmiar), y: Math.floor(y / this.rozmiar) };
    }
    /**
     * Zwraca wspolrzedne ograniczone do canvasu
     */
    clampXY(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, this.canvas.width));
        const y = Math.max(0, Math.min(clientY - rect.top, this.canvas.height));
        return { x, y };
    }
    /**
     * Zwraca prostokat na gridzie
     */
    prostokatGrid(startX, startY, endX, endY) {
        const minX = Math.floor(Math.min(startX, endX) / this.rozmiar);
        const minY = Math.floor(Math.min(startY, endY) / this.rozmiar);
        const maxX = Math.floor((Math.max(startX, endX) + 0.001) / this.rozmiar);
        const maxY = Math.floor((Math.max(startY, endY) + 0.001) / this.rozmiar);
        return { minX, minY, maxX, maxY };
    }
    /**
     * Obsluga wcisniecia myszki
     */
    handleMouseDown(e) {
        if (e.button !== 0)
            return;
        const coords = this.clampXY(e.clientX, e.clientY);
        if (coords.x < 0 || coords.x >= this.canvas.width || coords.y < 0 || coords.y >= this.canvas.height) {
            return;
        }
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.isDragging = false;
        this.podswietlone.clear();
        this.zaznaczOverlay = document.createElement('div');
        Object.assign(this.zaznaczOverlay.style, {
            position: 'fixed',
            border: '1px dashed #0078d7',
            backgroundColor: 'rgba(0, 120, 215, 0.1)',
            pointerEvents: 'none',
            zIndex: '1000',
            left: `${e.clientX}px`,
            top: `${e.clientY}px`,
            width: '0px',
            height: '0px',
        });
        document.addEventListener('mousemove', this.myszRuch);
        document.addEventListener('mouseup', this.myszUp);
        e.preventDefault();
    }
    /**
     * Obsluga ruchu myszki
     */
    handleMouseMove(e) {
        if (!this.isDragging) {
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;
            if (Math.sqrt(dx * dx + dy * dy) > 3) {
                this.isDragging = true;
                if (this.zaznaczOverlay) {
                    document.body.appendChild(this.zaznaczOverlay);
                }
            }
        }
        if (!this.isDragging || !this.zaznaczOverlay)
            return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        const overlayLeft = Math.min(this.startX, currentX);
        const overlayTop = Math.min(this.startY, currentY);
        const overlayWidth = Math.abs(currentX - this.startX);
        const overlayHeight = Math.abs(currentY - this.startY);
        Object.assign(this.zaznaczOverlay.style, {
            left: `${overlayLeft}px`,
            top: `${overlayTop}px`,
            width: `${overlayWidth}px`,
            height: `${overlayHeight}px`,
        });
        const startCoords = this.clampXY(this.startX, this.startY);
        const endCoords = this.clampXY(currentX, currentY);
        const { minX, minY, maxX, maxY } = this.prostokatGrid(startCoords.x, startCoords.y, endCoords.x, endCoords.y);
        const nowePodswietlone = new Set();
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (this.edytor.isValidCoordinate(x, y)) {
                    nowePodswietlone.add(`${x},${y}`);
                }
            }
        }
        this.podswietlone.forEach(blockKey => {
            if (!nowePodswietlone.has(blockKey)) {
                const [x, y] = blockKey.split(',').map(Number);
                this.edytor.unhighlightBlockTemporary(x, y);
            }
        });
        nowePodswietlone.forEach(blockKey => {
            if (!this.podswietlone.has(blockKey)) {
                const [x, y] = blockKey.split(',').map(Number);
                this.edytor.highlightBlockTemporary(x, y);
            }
        });
        this.podswietlone = nowePodswietlone;
    }
    /**
     * Obsluga puszczenia myszki
     */
    handleMouseUp(e) {
        var _a;
        document.removeEventListener('mousemove', this.myszRuch);
        document.removeEventListener('mouseup', this.myszUp);
        this.podswietlone.forEach(blockKey => {
            const [x, y] = blockKey.split(',').map(Number);
            this.edytor.unhighlightBlockTemporary(x, y);
        });
        this.podswietlone.clear();
        if ((_a = this.zaznaczOverlay) === null || _a === void 0 ? void 0 : _a.parentElement) {
            document.body.removeChild(this.zaznaczOverlay);
            this.zaznaczOverlay = null;
        }
        if (this.isDragging) {
            const startCoords = this.clampXY(this.startX, this.startY);
            const endCoords = this.clampXY(e.clientX, e.clientY);
            const { minX, minY, maxX, maxY } = this.prostokatGrid(startCoords.x, startCoords.y, endCoords.x, endCoords.y);
            const multiSelect = this.ctrl(e);
            this.edytor.selectBlocksInArea(minX, minY, maxX, maxY, multiSelect);
        }
        else {
            const gridCoords = this.gridXY(e.clientX, e.clientY);
            if (gridCoords && this.edytor.isValidCoordinate(gridCoords.x, gridCoords.y)) {
                const multiSelect = this.ctrl(e);
                this.edytor.toggleBlockSelection(gridCoords.x, gridCoords.y, multiSelect);
            }
        }
        this.isDragging = false;
    } /**
     * Obsluga klawiatury
     * Obsługuje skróty klawiszowe:
     * - Delete: usuwa zaznaczone bloki
     * - Ctrl/Cmd+Z: cofnij (undo)
     * - Ctrl/Cmd+Shift+Z: ponów (redo)
     * - Ctrl/Cmd+Y: ponów (redo)
     * - Ctrl/Cmd+X: wytnij zaznaczenie
     * - Ctrl/Cmd+C: kopiuj zaznaczenie
     * - Ctrl/Cmd+V: wklej zaznaczenie
     * - Ctrl/Cmd+A: zaznacz wszystko
     * - Ctrl/Cmd+S: zapisz do pliku
     * - Ctrl/Cmd+O: wczytaj z pliku
     */
    handleKeyDown(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        const isModifier = this.ctrl(e);
        const key = e.key.toLowerCase();
        let handled = true;
        switch (key) {
            case 'delete':
                this.edytor.deleteSelectedBlocks();
                break;
            case 'z':
                if (isModifier && !e.shiftKey)
                    this.edytor.undo();
                else if (isModifier && e.shiftKey)
                    this.edytor.redo();
                else
                    handled = false;
                break;
            case 'y':
                if (isModifier)
                    this.edytor.redo();
                else
                    handled = false;
                break;
            case 'x':
                if (isModifier)
                    this.edytor.cutSelection();
                else
                    handled = false;
                break;
            case 'c':
                if (isModifier)
                    this.edytor.copySelection();
                else
                    handled = false;
                break;
            case 'v':
                if (isModifier)
                    this.edytor.pasteSelection();
                else
                    handled = false;
                break;
            case 'a':
                if (isModifier)
                    this.edytor.selectAll();
                else
                    handled = false;
                break;
            case 's':
                if (isModifier)
                    this.edytor.saveToFile();
                else
                    handled = false;
                break;
            case 'o':
                if (isModifier)
                    this.edytor.loadFromFile();
                else
                    handled = false;
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
        }
    }
    /**
     * Obsluga menu kontekstowego
     */
    handleContextMenu(e) {
        var _a;
        e.preventDefault();
        (_a = document.getElementById('mapEditorContextMenu')) === null || _a === void 0 ? void 0 : _a.remove();
        const contextMenu = document.createElement('div');
        contextMenu.id = 'mapEditorContextMenu';
        Object.assign(contextMenu.style, {
            position: 'absolute',
            left: `${e.pageX}px`,
            top: `${e.pageY}px`,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            padding: '5px 0',
            zIndex: '1001',
            minWidth: '150px',
            fontFamily: 'sans-serif',
            fontSize: '14px'
        });
        this.edytor.populateContextMenu(contextMenu);
        document.body.appendChild(contextMenu);
        const menuRect = contextMenu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - menuRect.width - 5}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            contextMenu.style.top = `${window.innerHeight - menuRect.height - 5}px`;
        }
    }
}
