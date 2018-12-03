import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { AppConfig } from '../../environments/environment';
import { ElectronService } from './electron.service';

enum Status {
  LOADING = 'LOADING',
  DOWNLOAD_REQUESTED = 'DOWNLOAD_REQUESTED',
  DOWNLOAD_REQUIRED = 'DOWNLOAD_REQUIRED',
  DOWNLOAD_IN_PROGRESS = 'DOWNLOAD_IN_PROGRESS',
  EXTRACT_IN_PROGRESS = 'EXTRACT_IN_PROGRESS',
  PLAYABLE = 'PLAYABLE',
  EXTRACT_ERROR = 'EXTRACT_ERROR',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
}

@Injectable()
export class UpdateService {
  status$ = new BehaviorSubject<Status>(Status.LOADING);
  info$ = new BehaviorSubject<any>({});
  log$ = new BehaviorSubject<string>('');
  progress$ = new BehaviorSubject<number>(null);
  data: UpdateFile;
  installedVersions: string[];

  constructor(
    public electronService: ElectronService,
    public http: HttpClient,
    public zone: NgZone
  ) {
    this.appendLog('Update service initialized');
    this.electronService.ipcRenderer.on(
      'download-game.log',
      (event, log: string) =>
        this.zone.run(() => {
          this.appendLog(log);
        })
    );
  }

  getLog() {
    return this.log$;
  }

  getProgress() {
    return this.progress$;
  }

  getStatus() {
    return this.status$;
  }

  getInfo() {
    return this.info$;
  }

  getReleaseNotes() {
    const cachebuster = '?request' + Date.now();
    return this.http.get(AppConfig.releaseNotesUrl + cachebuster, {
      responseType: 'text',
    });
  }

  getLauncherUpdateRequired() {
    return this.getUpdateData().pipe(
      map(data => data.launcher.manupVersion > AppConfig.launcherVersion)
    );
  }

  getLatestGameVersion() {
    return this.getUpdateData().pipe(map(data => data.game.latestVersion));
  }

  getUpdateData() {
    if (this.data) return of(this.data);
    const cachebuster = '?request' + Date.now();
    return this.http.get(AppConfig.updateFileUrl + cachebuster).pipe(
      tap((data: UpdateFile) => {
        this.appendLog(JSON.stringify(data));
        this.data = data;
      }),
      switchMap(data =>
        this.getInstalledVersions().pipe(
          tap(installed => {
            if (installed.includes(data.game.latestVersion)) {
              this.status$.next(Status.PLAYABLE);
              this.progress$.next(100);
            } else {
              this.status$.next(Status.DOWNLOAD_REQUIRED);
            }
          })
        )
      ),
      map(() => this.data)
    );
  }

  getInstalledVersions(): Observable<string[]> {
    if (this.installedVersions) return of(this.installedVersions);
    return Observable.create(obs => {
      this.electronService.ipcRenderer.send('installed-versions');
      this.electronService.ipcRenderer.on(
        'installed-versions.get',
        (event, versions) =>
          this.zone.run(() => {
            this.installedVersions = versions;
            obs.next(versions);
            obs.complete();
          })
      );
    });
  }

  update() {
    return this.getUpdateData().subscribe(data => {
      this.downloadUpdate(data.game.latestVersion);
    });
  }

  private downloadUpdate(version: string) {
    this.electronService.ipcRenderer.send('download-game', version);
    this.status$.next(Status.DOWNLOAD_REQUESTED);
    this.electronService.ipcRenderer.on('download-game.started', () =>
      this.zone.run(() => {
        this.status$.next(Status.DOWNLOAD_IN_PROGRESS);
      })
    );
    this.electronService.ipcRenderer.on(
      'download-game.progress',
      (event, { bytesPerSecond, progress, receivedBytes, totalBytes }) =>
        this.zone.run(() => {
          this.progress$.next(progress * 100);
          const speedBps = bytesPerSecond;
          const speedKbps = speedBps / 1024;
          const speedMbps = speedKbps / 1024;
          let speed = speedBps.toFixed(2) + ' b/s';
          if (speedMbps >= 1) {
            speed = speedMbps.toFixed(2) + ' mb/s';
          } else if (speedKbps >= 1) {
            speed = speedKbps.toFixed(2) + ' kb/s';
          }
          this.info$.next({
            speed,
            receivedBytes,
            totalBytes,
          });
        })
    );
    this.electronService.ipcRenderer.on('download-game.extracting', event =>
      this.zone.run(() => {
        this.status$.next(Status.EXTRACT_IN_PROGRESS);
      })
    );
    this.electronService.ipcRenderer.on('download-game.complete', event =>
      this.zone.run(() => {
        this.status$.next(Status.PLAYABLE);
      })
    );
    this.electronService.ipcRenderer.on(
      'download-game.extract-error',
      (event, error) =>
        this.zone.run(() => {
          this.status$.next(Status.EXTRACT_ERROR);
        })
    );
    this.electronService.ipcRenderer.on(
      'download-game.download-error',
      (event, error) =>
        this.zone.run(() => {
          this.status$.next(Status.DOWNLOAD_ERROR);
        })
    );
  }

  private appendLog(log: string) {
    const text = `[${new Date().toISOString()}]\n${log}`;
    this.log$.next(this.log$.getValue() + `\n` + text);
  }

  launchGame() {
    this.appendLog('Request to launch game');
    this.getLatestGameVersion().subscribe(version => {
      this.appendLog('Launching game version ' + version);
      this.electronService.ipcRenderer.send('launch-game', version);
    });
  }
}
