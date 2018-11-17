import { Component, OnInit, HostListener } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { AppConfig } from '../environments/environment';
import { UpdateService } from './providers/update.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  // Prevent links opening Electron, instead request open in external browser
  @HostListener('document:click', ['$event', '$event.target'])
  onclick(e, target) {
    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      e.preventDefault();
      require('electron').shell.openExternal(href);
    }
  }

  constructor(
    public electronService: ElectronService,
    public updateService: UpdateService,
    public router: Router
  ) {
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
    } else {
      console.log('Mode web');
    }
  }

  ngOnInit() {
    this.updateService.getLauncherUpdateRequired().subscribe(updateRequired => {
      console.log('Update required?', updateRequired);
      if (updateRequired) this.router.navigate(['/', 'update-launcher']);
    });
  }

  minimize() {
    this.electronService.remote.BrowserWindow.getFocusedWindow().minimize();
  }

  close() {
    this.electronService.remote.BrowserWindow.getFocusedWindow().close();
  }
}
