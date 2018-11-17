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
  log$ = new BehaviorSubject<string>('');
  progress$ = new BehaviorSubject<number>(null);
  data: UpdateFile;

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

  getReleaseNotes() {
    return this.http.get(AppConfig.releaseNotesUrl, {
      responseType: 'text',
    });
  }

  getLauncherUpdateRequired() {
    return this.getUpdateData().pipe(
      map(data => data.launcher.latestVersion > AppConfig.launcherVersion)
    );
  }

  getLatestGameVersion() {
    return this.getUpdateData().pipe(map(data => data.game.latestVersion));
  }

  private getUpdateData() {
    if (this.data) return of(this.data);
    return this.http.get(AppConfig.updateFileUrl).pipe(
      tap((data: UpdateFile) => {
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
    return Observable.create(obs => {
      this.electronService.ipcRenderer.send('installed-versions');
      this.electronService.ipcRenderer.on(
        'installed-versions.get',
        (event, versions) =>
          this.zone.run(() => {
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
      (event, progress) =>
        this.zone.run(() => {
          this.progress$.next(progress * 100);
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
