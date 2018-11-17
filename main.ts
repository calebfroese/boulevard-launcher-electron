import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as DecompressZip from 'decompress-zip';

const { download } = require('electron-dl');

let win: BrowserWindow, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

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
    console.log(version);
    const filename = `${version}.zip`;
    const uri = [
      'https://s3.amazonaws.com/boulevard-versioning-bucket/releases',
      filename,
    ].join('/');
    console.log('Downloading', uri);
    const directory = path.join(app.getPath('temp'), 'Boulevard');
    console.log('Saving to', directory);
    const downloadItem = await download(win, uri, {
      directory: directory,
      onStarted: data => event.sender.send('download-game.started', data),
      onProgress: data => event.sender.send('download-game.progress', data),
    });
    event.sender.send('download-game.extracting');

    // Unzip
    const localFilePath = path.join(directory, filename);
    const unzipper = new DecompressZip(localFilePath);
    unzipper.on('error', function(err) {
      console.log('Caught an error');
      console.log(err);
    });

    unzipper.on('extract', function(log) {
      console.log('Finished extracting');
      console.log(log);
      event.sender.send('download-game.progress', 1);
      event.sender.send('download-game.complete');
    });

    unzipper.on('progress', function(fileIndex, fileCount) {
      event.sender.send('download-game.progress', fileIndex / fileCount);
    });

    const extractPath = path.join(app.getPath('appData'), 'Boulevard', version);
    console.log(extractPath);
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
