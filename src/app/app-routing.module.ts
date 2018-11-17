import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { UpdateLauncherComponent } from './components/update-launcher/update-launcher.component';
import { LoadingComponent } from './loading/loading.component';

const routes: Routes = [
  {
    path: '',
    component: LoadingComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'update-launcher',
    component: UpdateLauncherComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
