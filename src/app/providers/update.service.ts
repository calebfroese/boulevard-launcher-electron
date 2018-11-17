import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { AppConfig } from '../../environments/environment';
import { ElectronService } from './electron.service';

enum Status {
  LOADING = 'LOADING',
  UPDATE_REQUESTED = 'UPDATE_REQUESTED',
  UPDATE_REQUIRED = 'UPDATE_REQUIRED',
  UPDATE_IN_PROGRESS = 'UPDATE_IN_PROGRESS',
  PLAYABLE = 'PLAYABLE',
}

@Injectable()
export class UpdateService {
  status$ = new BehaviorSubject<Status>(Status.LOADING);
  progress$ = new BehaviorSubject<number>(null);
  data: UpdateFile;

  constructor(
    public electronService: ElectronService,
    public http: HttpClient,
    public zone: NgZone
  ) {}

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
      map((data: UpdateFile) => (this.data = data)),
      tap(data => {
        if (data.game.latestVersion > '-')
          this.status$.next(Status.UPDATE_REQUIRED);
        else this.status$.next(Status.PLAYABLE);
      })
    );
  }

  update() {
    return this.getUpdateData().subscribe(data => {
      this.downloadUpdate(data.game.latestVersion);
    });
  }

  private downloadUpdate(version: string) {
    this.electronService.ipcRenderer.send('download-game', version);
    this.status$.next(Status.UPDATE_REQUESTED);
    this.electronService.ipcRenderer.on('download-game.started', () =>
      this.zone.run(() => {
        this.status$.next(Status.UPDATE_IN_PROGRESS);
      })
    );
    this.electronService.ipcRenderer.on(
      'download-game.progress',
      (event, progress) =>
        this.zone.run(() => {
          this.progress$.next(progress * 100);
        })
    );
    this.electronService.ipcRenderer.on('download-game.complete', event =>
      this.zone.run(() => {
        this.status$.next(Status.PLAYABLE);
      })
    );
  }
}
