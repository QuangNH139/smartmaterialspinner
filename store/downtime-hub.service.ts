import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as signalR from '@microsoft/signalr';
import { lineProduceChanged } from './global.actions';
import { LineProduce } from './models/line-produce.model';

@Injectable({
  providedIn: 'root'
})
export class DowntimeHubService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl = 'hub/downtime';

  constructor(private store: Store) {}

  /**
   * Step 1: Create connection to hub/downtime
   * Establishes a SignalR connection to the downtime hub
   */
  public createConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.startConnection();
    this.setupListeners();
  }

  /**
   * Start the SignalR connection
   */
  private startConnection(): void {
    if (!this.hubConnection) {
      return;
    }

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR connection established to hub/downtime');
      })
      .catch((err) => {
        console.error('Error while establishing SignalR connection:', err);
        // Retry connection after 5 seconds
        setTimeout(() => this.startConnection(), 5000);
      });
  }

  /**
   * Step 2: Join Group
   * Subscribe to a group with LineCd, ProcessCd, DivisionCd parameters
   * @param lineCd Line code
   * @param processCd Process code
   * @param divisionCd Division code
   */
  public async joinGroup(lineCd: string, processCd: string, divisionCd: string): Promise<void> {
    if (!this.hubConnection) {
      throw new Error('Hub connection not initialized. Call createConnection() first.');
    }

    try {
      await this.hubConnection.invoke('JoinGroup', lineCd, processCd, divisionCd);
      console.log(`Successfully joined group with LineCd: ${lineCd}, ProcessCd: ${processCd}, DivisionCd: ${divisionCd}`);
    } catch (err) {
      console.error('Error joining group:', err);
      throw err;
    }
  }

  /**
   * Step 3: Listen server for lineProduceChange
   * Sets up listener for real-time updates from the server
   */
  private setupListeners(): void {
    if (!this.hubConnection) {
      return;
    }

    // Listen for lineProduceChange events from the server
    this.hubConnection.on('lineProduceChange', (lineProduce: LineProduce) => {
      console.log('Received lineProduceChange event:', lineProduce);
      
      // Dispatch action to update the store
      this.store.dispatch(lineProduceChanged({ lineProduce }));
    });

    // Handle reconnection
    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected. Connection ID:', connectionId);
    });

    // Handle connection closed
    this.hubConnection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.startConnection(), 5000);
    });
  }

  /**
   * Leave a group
   * @param lineCd Line code
   * @param processCd Process code
   * @param divisionCd Division code
   */
  public async leaveGroup(lineCd: string, processCd: string, divisionCd: string): Promise<void> {
    if (!this.hubConnection) {
      return;
    }

    try {
      await this.hubConnection.invoke('LeaveGroup', lineCd, processCd, divisionCd);
      console.log(`Successfully left group with LineCd: ${lineCd}, ProcessCd: ${processCd}, DivisionCd: ${divisionCd}`);
    } catch (err) {
      console.error('Error leaving group:', err);
    }
  }

  /**
   * Stop the SignalR connection
   */
  public async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      console.log('SignalR connection stopped');
      this.hubConnection = null;
    }
  }

  /**
   * Get connection state
   */
  public getConnectionState(): signalR.HubConnectionState | null {
    return this.hubConnection?.state ?? null;
  }

  /**
   * Check if connection is established
   */
  public isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}
