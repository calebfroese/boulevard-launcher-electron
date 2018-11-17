import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as rimraf from 'rimraf';
import * as fs from 'fs';
import * as DecompressZip from 'decompress-zip';
import * as child_process from 'child_process';

const { download } = require('electron-dl');

let win: BrowserWindow, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

// Temporary location where game artifacts are downloaded to
const tempDirectory = path.join(app.getPath('temp'), 'Boulevard', 'artifacts');
// Where the extracted game is stored
const installationDirectory = path.join(
  app.getPath('appData'),
  'Boulevard',
  'versions'
);

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    resizable: false,
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  ipcMain.on('installed-versions', async event => {
    event.sender.send('download-game.log', 'Discovering installed versions');
    const installedVersions = await getInstalledVersions();
    event.sender.send(
      'download-game.log',
      `Found ${installedVersions.length} versions installed`
    );
    event.sender.send('installed-versions.get', installedVersions);
  });

  ipcMain.on('launch-game', async (event, version) => {
    event.sender.send(
      'download-game.log',
      'Launching game executable on' + process.platform
    );
    let filename = '';
    switch (process.platform) {
      case 'darwin': {
        filename = 'Shelby.app/Contents/MacOS/Shelby';
        break;
      }
      case 'win32':
      default: {
        filename = 'Shelby.exe';
        break;
      }
    }
    const executableLocation = path.join(
      installationDirectory,
      version,
      filename
    );
    event.sender.send(
      'download-game.log',
      `Launching from ${executableLocation}`
    );
    child_process.execFile(executableLocation);
  });

  ipcMain.on('download-game', async (event, version) => {
    event.sender.send(
      'download-game.log',
      `Requesting download of version ${version}`
    );
    const filename = `${version}.zip`;
    const uri = [
      'https://s3.amazonaws.com/boulevard-versioning-bucket/releases',
      process.platform,
      filename,
    ].join('/');
    event.sender.send('download-game.log', `Downloading from ${uri}`);

    // Clean temp directory, download from fresh
    await new Promise((resolve, reject) => {
      rimraf(tempDirectory, (err, data) => {
        if (err) {
          event.sender.send('download-game.download-error', err);
          event.sender.send(
            'download-game.log',
            'Failed to clean artifact directory'
          );
          event.sender.send('download-game.log', err);
          return reject(err);
        }
        return resolve(data);
      });
    });

    // Download the latest game zip
    try {
      await download(win, uri, {
        directory: tempDirectory,
        onStarted: data => {
          event.sender.send('download-game.started', data);
          event.sender.send('download-game.log', 'Download started');
        },
        onProgress: data => {
          event.sender.send('download-game.progress', data);
          event.sender.send('download-game.log', `${data * 100}%`);
        },
        onCancel: data => {
          event.sender.send('download-game.download-error', data);
          event.sender.send('download-game.log', 'Download cancelled');
          event.sender.send('download-game.log', data);
        },
      });
    } catch (error) {
      event.sender.send('download-game.download-error', error);
      event.sender.send('download-game.log', error);
      return;
    }
    event.sender.send('download-game.progress', 1);

    // Unzip
    event.sender.send('download-game.extracting');
    event.sender.send('download-game.log', 'Beginning extraction');
    const tempFilePath = path.join(tempDirectory, filename);
    const unzipper = new DecompressZip(tempFilePath);
    unzipper.on('error', err => {
      event.sender.send('download-game.extract-error', err);
    });

    unzipper.on('extract', log => {
      event.sender.send('download-game.complete');
      event.sender.send(
        'download-game.log',
        log.reduce((text, logObj) => {
          if (logObj.folder) return (text += '\nFolder ' + logObj.folder);
          if (logObj.deflated) return (text += '\nDeflated ' + logObj.deflated);
          return text;
        }, '')
      );
      event.sender.send('download-game.log', 'Files extracted successfully');
      event.sender.send('download-game.progress', 1);
      // Clean temp directory
      rimraf(tempDirectory, () => {
        event.sender.send('download-game.log', 'Cleaned up download artifacts');
      });
    });

    unzipper.on('progress', (fileIndex, fileCount) => {
      event.sender.send('download-game.progress', fileIndex / fileCount);
      event.sender.send(
        'download-game.log',
        `Extraction ${fileIndex + 1} / ${fileCount}`
      );
    });

    const extractPath = path.join(installationDirectory, version);
    unzipper.extract({
      path: extractPath,
      filter: function(file) {
        return file.type !== 'SymbolicLink';
      },
    });
  });
}

// Reads the installation directory and fetches all the game folders as string[]
async function getInstalledVersions() {
  const dirs = await new Promise<string[]>((resolve, reject) => {
    fs.readdir(installationDirectory, (err, data) =>
      err ? resolve([] as string[]) : resolve(data)
    );
  });
  console.log('Found', dirs.length);
  // Filter out non versions (e.g. DS_STORE)
  return dirs.filter(item => {
    console.log('Testing', item, /.*\..*\..*/.test(item));
    return /.*\..*\..*/.test(item);
  });
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
