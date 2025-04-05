import { MapEditor } from './MapEditor.js';
import { TexturePalette } from './TexturePalette.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
    const textureGrid = document.getElementById('texture-grid') as HTMLDivElement;

    const editor = new MapEditor(canvas);
    const palette = new TexturePalette(textureGrid);

    palette.onTextureSelect((texture) => {
        editor.setCurrentTexture(texture);
    });
});
