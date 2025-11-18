import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DowntimeHubService } from './downtime-hub.service';
import { LineProduce } from './models/line-produce.model';
import { 
  selectLineProduces, 
  selectSelectedLineProduce 
} from './global.reducer';

/**
 * Example component demonstrating how to use the DowntimeHubService
 * to listen for real-time changes to lineProduces and selectedLineProduce
 */
@Component({
  selector: 'app-downtime-monitor',
  template: `
    <div class="downtime-monitor">
      <h2>Downtime Monitor</h2>
      
      <div class="connection-status">
        <strong>Connection Status:</strong> 
        <span [class.connected]="isConnected" [class.disconnected]="!isConnected">
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>

      <div class="group-subscription">
        <h3>Subscribe to Group</h3>
        <input [(ngModel)]="lineCd" placeholder="Line Code">
        <input [(ngModel)]="processCd" placeholder="Process Code">
        <input [(ngModel)]="divisionCd" placeholder="Division Code">
        <button (click)="subscribeToGroup()">Join Group</button>
        <button (click)="unsubscribeFromGroup()">Leave Group</button>
      </div>

      <div class="selected-line-produce">
        <h3>Selected Line Produce</h3>
        <div *ngIf="selectedLineProduce$ | async as selected; else noSelection">
          <p><strong>Line Code:</strong> {{ selected.lineCd }}</p>
          <p><strong>Process Code:</strong> {{ selected.processCd }}</p>
          <p><strong>Division Code:</strong> {{ selected.divisionCd }}</p>
          <p><strong>Status:</strong> {{ selected.status }}</p>
          <p><strong>Last Updated:</strong> {{ selected.lastUpdated | date:'medium' }}</p>
        </div>
        <ng-template #noSelection>
          <p>No line produce selected</p>
        </ng-template>
      </div>

      <div class="line-produces-list">
        <h3>All Line Produces</h3>
        <div *ngFor="let lineProduce of lineProduces$ | async" class="line-produce-item">
          <p><strong>{{ lineProduce.lineCd }}</strong> - {{ lineProduce.lineName }}</p>
          <p>Process: {{ lineProduce.processCd }}, Division: {{ lineProduce.divisionCd }}</p>
          <p>Status: {{ lineProduce.status }}</p>
          <small>Updated: {{ lineProduce.lastUpdated | date:'short' }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .downtime-monitor {
      padding: 20px;
    }
    .connection-status {
      margin: 10px 0;
    }
    .connected {
      color: green;
      font-weight: bold;
    }
    .disconnected {
      color: red;
      font-weight: bold;
    }
    .group-subscription {
      margin: 20px 0;
    }
    .group-subscription input {
      margin: 5px;
      padding: 5px;
    }
    .group-subscription button {
      margin: 5px;
      padding: 5px 10px;
    }
    .line-produce-item {
      border: 1px solid #ccc;
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
    }
  `],
  standalone: false
})
export class DowntimeMonitorComponent implements OnInit, OnDestroy {
  // Observables for store data
  lineProduces$: Observable<LineProduce[]>;
  selectedLineProduce$: Observable<LineProduce | null>;
  
  // Connection status
  isConnected = false;
  
  // Form fields for group subscription
  lineCd = '';
  processCd = '';
  divisionCd = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private downtimeHubService: DowntimeHubService
  ) {
    // Initialize observables
    this.lineProduces$ = this.store.select(selectLineProduces);
    this.selectedLineProduce$ = this.store.select(selectSelectedLineProduce);
  }

  ngOnInit(): void {
    // Step 1: Create connection to hub/downtime
    this.downtimeHubService.createConnection();
    
    // Monitor connection status
    this.checkConnectionStatus();
    
    // Subscribe to lineProduces changes
    this.lineProduces$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lineProduces => {
        console.log('Line produces updated:', lineProduces);
      });
    
    // Subscribe to selectedLineProduce changes
    this.selectedLineProduce$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        console.log('Selected line produce changed:', selected);
      });
  }

  ngOnDestroy(): void {
    // Cleanup
    this.destroy$.next();
    this.destroy$.complete();
    
    // Stop SignalR connection
    this.downtimeHubService.stopConnection();
  }

  /**
   * Step 2: Join Group with LineCd, ProcessCd, DivisionCd
   */
  async subscribeToGroup(): Promise<void> {
    if (!this.lineCd || !this.processCd || !this.divisionCd) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await this.downtimeHubService.joinGroup(
        this.lineCd,
        this.processCd,
        this.divisionCd
      );
      console.log('Successfully subscribed to group');
    } catch (error) {
      console.error('Failed to subscribe to group:', error);
    }
  }

  /**
   * Leave the current group
   */
  async unsubscribeFromGroup(): Promise<void> {
    if (!this.lineCd || !this.processCd || !this.divisionCd) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await this.downtimeHubService.leaveGroup(
        this.lineCd,
        this.processCd,
        this.divisionCd
      );
      console.log('Successfully unsubscribed from group');
    } catch (error) {
      console.error('Failed to unsubscribe from group:', error);
    }
  }

  /**
   * Check connection status periodically
   */
  private checkConnectionStatus(): void {
    setInterval(() => {
      this.isConnected = this.downtimeHubService.isConnected();
    }, 1000);
  }
}
