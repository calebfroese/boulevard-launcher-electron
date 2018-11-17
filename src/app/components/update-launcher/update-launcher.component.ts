import { Component, OnInit } from '@angular/core';
import { UpdateService } from '../../providers/update.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../../../environments/environment';

@Component({
  selector: 'app-update-launcher',
  templateUrl: './update-launcher.component.html',
  styleUrls: ['./update-launcher.component.scss'],
})
export class UpdateLauncherComponent implements OnInit {
  latestLauncherVersion$: Observable<string>;
  currentLauncherVersion = AppConfig.launcherVersion;

  constructor(public updateService: UpdateService) { }

  ngOnInit() {
    this.latestLauncherVersion$ = this.updateService.getUpdateData().pipe(
      map(data => data.launcher.latestVersion)
    )
  }
}
