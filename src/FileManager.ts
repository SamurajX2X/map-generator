export interface MapSaveData {
    version: number;
    width: number;
    height: number;
    tileSize: number;
    grid: string[][];
}

/**
 * Zarzadza zapisem i wczytywaniem mapy
 */
export class FileManager {

    /**
     * Zapisuje mapę do pliku
     */
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
            console.error("Błąd zapisu mapy do pliku:", error);
            alert("Nie udało się zapisać mapy.");
        }
    }

    /**
     * Wczytuje mapę z pliku
     */
    public loadFromFile(): Promise<MapSaveData> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';

            input.onchange = (e: Event) => {
                const target = e.target as HTMLInputElement;
                if (!target.files || target.files.length === 0) {
                    return reject(new Error("Nie wybrano pliku."));
                }

                const file = target.files[0];
                const reader = new FileReader();

                reader.onload = (event: ProgressEvent<FileReader>) => {
                    try {
                        const content = event.target?.result as string;
                        if (!content) {
                            throw new Error("Plik jest pusty.");
                        }
                        const data = JSON.parse(content);

                        if (typeof data !== 'object' || data === null || !Array.isArray(data.grid) ||
                            typeof data.width !== 'number' || typeof data.height !== 'number' ||
                            typeof data.tileSize !== 'number' || typeof data.version !== 'number') {
                            throw new Error("Zły format pliku mapy.");
                        }

                        resolve(data as MapSaveData);

                    } catch (error: unknown) {
                        const message = error instanceof Error ? error.message : "Wystąpił nieznany błąd podczas parsowania.";
                        console.error("Nie udało się sparsować pliku mapy:", message);
                        reject(new Error(`Nie udało się wczytać mapy: ${message}`));
                    }
                };

                reader.onerror = () => {
                    console.error("Błąd odczytu pliku:", reader.error);
                    reject(new Error("Błąd odczytu wybranego pliku."));
                };

                reader.readAsText(file);
            };

            input.addEventListener('cancel', () => {
                reject(new Error("Anulowano wybór pliku."));
            });

            input.click();
        });
    }
}
