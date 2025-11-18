import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { reducer } from './global.reducer';
import { DowntimeHubService } from './downtime-hub.service';
import { DowntimeMonitorComponent } from './downtime-monitor.component';

@NgModule({
  declarations: [
    DowntimeMonitorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    StoreModule.forFeature('global', reducer)
  ],
  providers: [
    DowntimeHubService
  ],
  exports: [
    DowntimeMonitorComponent
  ]
})
export class GlobalStoreModule { }
