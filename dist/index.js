import { MapEditor } from './MapEditor.js';
import { TexturePalette } from './TexturePalette.js';
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mapCanvas');
    const textureGrid = document.getElementById('texture-grid');
    const editor = new MapEditor(canvas);
    const palette = new TexturePalette(textureGrid);
    palette.onTextureSelect((texture) => {
        editor.setCurrentTexture(texture);
    });
});
