import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as rimraf from 'rimraf';
import * as DecompressZip from 'decompress-zip';

const { download } = require('electron-dl');

let win: BrowserWindow, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

// Temporary location where game artifacts are downloaded to
const tempDirectory = path.join(app.getPath('temp'), 'Boulevard', 'artifacts');
// Where the extracted game is stored
const gameDirectory = path.join(app.getPath('appData'), 'Boulevard');

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
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

  ipcMain.on('download-game', async (event, version) => {
    const filename = `${version}.zip`;
    const uri = [
      'https://s3.amazonaws.com/boulevard-versioning-bucket/releases',
      filename,
    ].join('/');

    // Clean temp directory, download from fresh
    await new Promise((resolve, reject) => {
      rimraf(tempDirectory, (err, data) => {
        if (err) {
          event.sender.send('download-game.download-error', err);
          return reject(err);
        }
        return resolve(data);
      });
    });

    // Download the latest game zip
    try {
      await download(win, uri, {
        directory: tempDirectory,
        onStarted: data => event.sender.send('download-game.started', data),
        onProgress: data => event.sender.send('download-game.progress', data),
        onCancel: data =>
          event.sender.send('download-game.download-error', data),
      });
    } catch (error) {
      event.sender.send('download-game.download-error', error);
      return;
    }

    // Unzip
    event.sender.send('download-game.extracting');
    const tempFilePath = path.join(tempDirectory, filename);
    const unzipper = new DecompressZip(tempFilePath);
    unzipper.on('error', err => {
      event.sender.send('download-game.extract-error', err);
    });

    unzipper.on('extract', log => {
      event.sender.send('download-game.complete');
      console.log(log);
      // Clean temp directory
      rimraf(tempDirectory, () => null);
    });

    unzipper.on('progress', (fileIndex, fileCount) => {
      event.sender.send('download-game.progress', fileIndex / fileCount);
    });

    const extractPath = path.join(gameDirectory, version);
    unzipper.extract({
      path: extractPath,
      filter: function(file) {
        return file.type !== 'SymbolicLink';
      },
    });
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
