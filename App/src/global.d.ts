
import type { FolderScan } from "./lib/files";

export {};

declare global {
  interface Window {
    api: {
      scanFolder: (dir: string, recursive?: boolean, maxDepth?: number) => Promise<FolderScan>;
      onScanProgress: (callback: (scan: FolderScan) => void) => () => void;
    };
  }
}