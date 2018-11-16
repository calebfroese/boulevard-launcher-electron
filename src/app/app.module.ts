import '../polyfills';
import 'reflect-metadata';

import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { UpdateLauncherComponent } from './components/update-launcher/update-launcher.component';
import { WebviewDirective } from './directives/webview.directive';
import { ElectronService } from './providers/electron.service';
import { UpdateService } from './providers/update.service';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    UpdateLauncherComponent,
    WebviewDirective,
  ],
  imports: [BrowserModule, FormsModule, HttpClientModule, AppRoutingModule],
  providers: [ElectronService, UpdateService],
  bootstrap: [AppComponent],
})
export class AppModule {}
