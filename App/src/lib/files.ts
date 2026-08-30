
export type FileEntry = {
    name: string;
    path: string;
    size: number;
    isDir: false;
};

export type FolderScan = {
    path: string;
    size: number;
    contents: Array<FileEntry | FolderScan>;
    isDir: true;
};


const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

// Formats a byte count as a human-readable string, e.g. 1536 -> "1.5 KB".
export function formatSize(bytes: number): string {
    if (bytes <= 0) return "0 B";

    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        SIZE_UNITS.length - 1,
    );
    const value = bytes / 1024 ** exponent;

    return `${exponent === 0 ? value : value.toFixed(1)} ${SIZE_UNITS[exponent]}`;
}

// The actual directory walk runs in the main process (see main.ts) to avoid an IPC
// round-trip per file; this just kicks it off and streams back progress snapshots.
// maxDepth (if set) limits how many levels below dir are descended into.
export function scanFolder(
    dir: string,
    recursive = true,
    onUpdate?: (root: FolderScan) => void,
    maxDepth?: number,
): Promise<FolderScan> {
    const unsubscribe = onUpdate && window.api.onScanProgress(onUpdate);
    return window.api.scanFolder(dir, recursive, maxDepth).finally(() => unsubscribe?.());
}
