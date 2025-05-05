export interface MapSaveData {
    version: number;
    width: number;
    height: number;
    tileSize: number;
    grid: string[][];
}

export class FileManager {

    public saveToFile(mapData: MapSaveData, defaultFilename: string = 'map-data.json'): void {
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
        } catch (error) {
            console.error("Error saving map to file:", error);
            alert("Failed to save map data.");
        }
    }

    public loadFromFile(): Promise<MapSaveData> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';

            input.onchange = (e: Event) => {
                const target = e.target as HTMLInputElement;
                if (!target.files || target.files.length === 0) {
                    return reject(new Error("No file selected."));
                }

                const file = target.files[0];
                const reader = new FileReader();

                reader.onload = (event: ProgressEvent<FileReader>) => {
                    try {
                        const content = event.target?.result as string;
                        if (!content) {
                            throw new Error("File content is empty.");
                        }
                        const data = JSON.parse(content);

                        if (typeof data !== 'object' || data === null || !Array.isArray(data.grid) ||
                            typeof data.width !== 'number' || typeof data.height !== 'number' ||
                            typeof data.tileSize !== 'number' || typeof data.version !== 'number') {
                            throw new Error("Invalid map data format.");
                        }

                        resolve(data as MapSaveData);

                    } catch (error: unknown) {
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
