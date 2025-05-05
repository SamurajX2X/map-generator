export class FileManager {
    saveToFile(mapData, defaultFilename = 'map-data.json') {
        try {
            const jsonString = JSON.stringify(mapData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = defaultFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log("Map saved successfully.");
        }
        catch (error) {
            console.error("Error saving map to file:", error);
            alert("Failed to save map data.");
        }
    }
    loadFromFile() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.onchange = (e) => {
                const target = e.target;
                if (!target.files || target.files.length === 0) {
                    return reject(new Error("No file selected."));
                }
                const file = target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    var _a;
                    try {
                        const content = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
                        if (!content) {
                            throw new Error("File content is empty.");
                        }
                        const data = JSON.parse(content);
                        if (typeof data !== 'object' || data === null || !Array.isArray(data.grid) ||
                            typeof data.width !== 'number' || typeof data.height !== 'number' ||
                            typeof data.tileSize !== 'number' || typeof data.version !== 'number') {
                            throw new Error("Invalid map data format.");
                        }
                        console.log("Map loaded successfully.");
                        resolve(data);
                    }
                    catch (error) {
                        const message = error instanceof Error ? error.message : "An unknown error occurred during parsing.";
                        console.error("Failed to parse map file:", message);
                        reject(new Error(`Failed to load map: ${message}`));
                    }
                };
                reader.onerror = () => {
                    console.error("Error reading file:", reader.error);
                    reject(new Error("Error reading the selected file."));
                };
                reader.readAsText(file);
            };
            input.addEventListener('cancel', () => {
                reject(new Error("File selection cancelled."));
            });
            input.click();
        });
    }
}
