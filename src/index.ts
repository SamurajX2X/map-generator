import { MapEditor } from './MapEditor.js';
import { TexturePalette } from './TexturePalette.js';

/**
 * @param e
 */
document.addEventListener('DOMContentLoaded', (e) => {
    const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
    const textureGrid = document.getElementById('texture-grid') as HTMLDivElement;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;

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

/**
 * @param e
 */
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});
