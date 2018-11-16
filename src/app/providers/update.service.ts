import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppConfig } from '../../environments/environment';
import { ElectronService } from './electron.service';

@Injectable()
export class UpdateService {
  data: UpdateFile;

  constructor(
    public electronService: ElectronService,
    public http: HttpClient
  ) {}

  getLauncherUpdateRequired() {
    return this.getUpdateData().pipe(
      map(data => data.launcher.latestVersion > AppConfig.launcherVersion)
    );
  }

  private getUpdateData() {
    if (this.data) return of(this.data);
    return this.http
      .get(AppConfig.updateFileUrl)
      .pipe(map((data: UpdateFile) => (this.data = data)));
  }
}
