import { MapEditor } from './MapEditor.js';
import { TexturePalette } from './TexturePalette.js';
// tu nie ma sensu docstringów, bo to tylko startuje aplikacje i podpina eventy
// zmienne: canvas, textureGrid, clearBtn, exportBtn, editor, palette
document.addEventListener('DOMContentLoaded', (e) => {
    const canvas = document.getElementById('mapCanvas');
    const textureGrid = document.getElementById('texture-grid');
    const clearBtn = document.getElementById('clearBtn');
    const exportBtn = document.getElementById('exportBtn');
    const editor = new MapEditor(canvas);
    const palette = new TexturePalette(textureGrid);
    palette.onTextureSelect((texture) => {
        editor.setCurrentTexture(texture);
    });
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            editor.clearMap();
        });
    }
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const mapData = editor.exportMap();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapData));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "map-data.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });
    }
});
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});
