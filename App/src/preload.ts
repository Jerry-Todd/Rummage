// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// Context Bridge for reading directory
import { contextBridge, ipcRenderer } from "electron";
import type { FolderScan } from "./lib/files";
contextBridge.exposeInMainWorld("api", {
  scanFolder: (dir: string, recursive = true, maxDepth?: number): Promise<FolderScan> =>
    ipcRenderer.invoke("scan-folder", dir, recursive, maxDepth),
  onScanProgress: (callback: (scan: FolderScan) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, scan: FolderScan) => callback(scan);
    ipcRenderer.on("scan-progress", listener);
    return () => ipcRenderer.removeListener("scan-progress", listener);
  },
});