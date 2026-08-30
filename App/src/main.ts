import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import type { FolderScan } from './lib/files';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Caps concurrent fs syscalls during a scan so we don't try to open tens of thousands
// of file descriptors at once, which would thrash the disk and stall the whole process.
const MAX_CONCURRENT_FS_CALLS = 128;
let activeFsCalls = 0;
const fsQueue: Array<() => void> = [];

function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeFsCalls++;
      fn().then(resolve, reject).finally(() => {
        activeFsCalls--;
        fsQueue.shift()?.();
      });
    };
    if (activeFsCalls < MAX_CONCURRENT_FS_CALLS) {
      run();
    } else {
      fsQueue.push(run);
    }
  });
}

// Pseudo-filesystems: their "files" are virtual and can report bogus sizes (e.g. /proc/kcore
// reports the size of the whole virtual address space, often 100+ TB) or recurse forever
// (e.g. /proc/<pid>/root). They aren't real disk usage, so never descend into them.
const SKIP_DIRS = new Set(["/proc", "/sys", "/dev"]);
// "/usr", "/home"
async function statEntry(entryPath: string) {
  try {
    // lstat (not stat) so symlinks - e.g. /proc/<pid>/root pointing back to "/" - aren't
    // followed and mistaken for real directories, which would cause infinite recursion.
    const stats = await withConcurrencyLimit(() => fs.promises.lstat(entryPath));
    return { size: stats.size, isDirectory: stats.isDirectory() };
  } catch {
    return { size: 0, isDirectory: false };
  }
}

async function listEntries(dir: string): Promise<string[]> {
  try {
    return await withConcurrencyLimit(() => fs.promises.readdir(dir));
  } catch {
    // Permission-denied or unreadable directories shouldn't abort the whole scan.
    return [];
  }
}

// Runs entirely in the main process (no IPC per file) and reports progress via onUpdate,
// which the caller can throttle before forwarding to the renderer. maxDepth (if set) stops
// recursing past that many levels below the starting directory.
async function scanFolder(
  dir: string,
  recursive: boolean,
  onUpdate: (root: FolderScan) => void,
  maxDepth?: number,
  depth = 0,
  root?: FolderScan,
): Promise<FolderScan> {
  const contents = await listEntries(dir);
  const scan: FolderScan = { path: dir, size: 0, contents: [], isDir: true };
  const rootScan = root ?? scan;
  const canDescend = recursive && (maxDepth === undefined || depth < maxDepth);

  await Promise.all(contents.map(async (file) => {
    const entryPath = dir.endsWith('/') ? `${dir}${file}` : `${dir}/${file}`;
    if (SKIP_DIRS.has(entryPath)) {
      scan.contents.push({ path: entryPath, size: 0, contents: [], isDir: true });
      onUpdate(rootScan);
      return;
    }
    const stats = await statEntry(entryPath);
    if (!stats.isDirectory) {
      scan.contents.push({ name: file, path: entryPath, size: stats.size, isDir: false });
      scan.size += stats.size;
      onUpdate(rootScan);
    } else if (canDescend) {
      const subScan = await scanFolder(entryPath, true, onUpdate, maxDepth, depth + 1, rootScan);
      scan.contents.push(subScan);
      scan.size += subScan.size;
      onUpdate(rootScan);
    } else {
      // Non-recursive scans (or ones past maxDepth) still list subfolders, just without descending.
      const subScan: FolderScan = { path: entryPath, size: 0, contents: [], isDir: true };
      scan.contents.push(subScan);
      onUpdate(rootScan);
    }
  }));

  return scan;
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {

  // Handler for scanning a directory tree; streams progress via "scan-progress" and
  // resolves with the final result once the whole scan is done.
  ipcMain.handle("scan-folder", async (event, dir: string, recursive: boolean, maxDepth?: number) => {
    let latest: FolderScan | null = null;
    // Batch progress to a fixed interval instead of one IPC message per file discovered.
    const interval = setInterval(() => {
      if (latest) event.sender.send("scan-progress", latest);
    }, 100);

    try {
      return await scanFolder(dir, recursive, (root) => { latest = root; }, maxDepth);
    } finally {
      clearInterval(interval);
    }
  });

  createWindow()
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
