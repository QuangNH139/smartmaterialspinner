# Store Example - SignalR Hub Integration

This folder contains example code demonstrating how to listen to changes from `lineProduces` and `selectedLineProduce` using SignalR hub connection.

## Overview

This implementation follows the three-step process for real-time communication:

1. **Create connection** to `hub/downtime`
2. **Join Group** with parameters: `LineCd`, `ProcessCd`, `DivisionCd`
3. **Listen to server** for `lineProduceChange` events

## Architecture

### Files Structure

```
store/
├── models/
│   └── line-produce.model.ts      # LineProduce interface definition
├── global.reducer.ts               # NgRx reducer for state management
├── global.actions.ts               # NgRx actions
├── downtime-hub.service.ts        # SignalR hub service
├── downtime-monitor.component.ts  # Example component
└── README.md                       # This file
```

## Key Components

### 1. State Management (global.reducer.ts)

The reducer manages the state for:
- `lineProduces`: Array of all line produces
- `selectedLineProduce`: Currently selected line produce
- `loading`: Loading state
- `error`: Error messages

#### State Interface
```typescript
export interface GlobalState {
  lineProduces: LineProduce[];
  selectedLineProduce: LineProduce | null;
  loading: boolean;
  error: string | null;
}
```

#### Key Actions
- `loadLineProduces`: Load line produces from API
- `selectLineProduce`: Select a specific line produce
- `lineProduceChanged`: Real-time update from SignalR (line 72)
- `clearSelectedLineProduce`: Clear selection

### 2. SignalR Hub Service (downtime-hub.service.ts)

This service implements the three requirements:

#### Step 1: Create Connection
```typescript
public createConnection(): void {
  this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl('hub/downtime')
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  this.startConnection();
  this.setupListeners();
}
```

#### Step 2: Join Group
```typescript
public async joinGroup(
  lineCd: string, 
  processCd: string, 
  divisionCd: string
): Promise<void> {
  await this.hubConnection.invoke('JoinGroup', lineCd, processCd, divisionCd);
}
```

#### Step 3: Listen to Server
```typescript
private setupListeners(): void {
  this.hubConnection.on('lineProduceChange', (lineProduce: LineProduce) => {
    // Dispatch action to update the store
    this.store.dispatch(lineProduceChanged({ lineProduce }));
  });
}
```

### 3. Example Component (downtime-monitor.component.ts)

Demonstrates how to use the service and subscribe to state changes:

```typescript
ngOnInit(): void {
  // Step 1: Create connection
  this.downtimeHubService.createConnection();
  
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
```

## Usage Example

### In Your Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DowntimeHubService } from './store/downtime-hub.service';
import { LineProduce } from './store/models/line-produce.model';
import { selectLineProduces, selectSelectedLineProduce } from './store/global.reducer';

@Component({
  selector: 'app-my-component',
  template: `...`
})
export class MyComponent implements OnInit, OnDestroy {
  lineProduces$: Observable<LineProduce[]>;
  selectedLineProduce$: Observable<LineProduce | null>;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private downtimeHubService: DowntimeHubService
  ) {
    this.lineProduces$ = this.store.select(selectLineProduces);
    this.selectedLineProduce$ = this.store.select(selectSelectedLineProduce);
  }

  ngOnInit(): void {
    // 1. Create connection
    this.downtimeHubService.createConnection();
    
    // 2. Join group
    this.downtimeHubService.joinGroup('LINE001', 'PROC001', 'DIV001');
    
    // 3. Listen to changes (automatically handled by the service)
    // Subscribe to state changes in your component
    this.lineProduces$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lineProduces => {
        // Handle lineProduces updates
      });
    
    this.selectedLineProduce$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        // Handle selectedLineProduce updates
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.downtimeHubService.stopConnection();
  }
}
```

### Module Setup

Make sure to import the required modules in your app module:

```typescript
import { StoreModule } from '@ngrx/store';
import { reducer } from './store/global.reducer';
import { DowntimeHubService } from './store/downtime-hub.service';

@NgModule({
  imports: [
    StoreModule.forRoot({ global: reducer }),
    // ... other imports
  ],
  providers: [
    DowntimeHubService,
    // ... other providers
  ]
})
export class AppModule { }
```

## Real-time Updates Flow

1. **Server Event**: Server sends `lineProduceChange` event with updated LineProduce data
2. **Hub Service**: `DowntimeHubService` receives the event in `setupListeners()`
3. **Action Dispatch**: Service dispatches `lineProduceChanged` action to the store
4. **Reducer Update**: `global.reducer.ts` processes the action and updates state (line 72)
5. **Component Update**: Components subscribed to `lineProduces$` or `selectedLineProduce$` receive updates

## Important Notes

### Line 72 in global.reducer.ts
This is where the real-time update from SignalR is handled:

```typescript
// Handle real-time update from SignalR
on(lineProduceChanged, (state, { lineProduce }) => {
  const updatedLineProduces = state.lineProduces.map(lp => 
    lp.lineCd === lineProduce.lineCd ? lineProduce : lp
  );
  
  // Update selected line produce if it matches
  const updatedSelectedLineProduce = state.selectedLineProduce?.lineCd === lineProduce.lineCd 
    ? lineProduce 
    : state.selectedLineProduce;
  
  return {
    ...state,
    lineProduces: updatedLineProduces,
    selectedLineProduce: updatedSelectedLineProduce
  };
})
```

### Automatic Reconnection
The service automatically reconnects if the connection is lost:
- Uses `withAutomaticReconnect()` in connection builder
- Implements retry logic in `onclose` handler

### Memory Management
Always unsubscribe from observables in `ngOnDestroy()` to prevent memory leaks:
```typescript
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  this.downtimeHubService.stopConnection();
}
```

## Dependencies

This implementation requires the following packages:

```json
{
  "dependencies": {
    "@angular/core": "^17.0.0",
    "@ngrx/store": "^17.0.0",
    "@microsoft/signalr": "^8.0.0",
    "rxjs": "^7.8.0"
  }
}
```

Install with:
```bash
npm install @ngrx/store @microsoft/signalr
```

## Testing

To test the implementation:

1. Ensure your SignalR server is running at the configured hub URL
2. Import the `DowntimeMonitorComponent` in your module
3. Add the component to your routing or template
4. Open the browser console to see connection logs
5. Use the form to join a group with LineCd, ProcessCd, and DivisionCd
6. Trigger a `lineProduceChange` event from the server
7. Observe the state updates in your component

## Server-side Requirements

Your SignalR server should implement:

```csharp
public class DowntimeHub : Hub
{
    public async Task JoinGroup(string lineCd, string processCd, string divisionCd)
    {
        var groupName = $"{lineCd}_{processCd}_{divisionCd}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string lineCd, string processCd, string divisionCd)
    {
        var groupName = $"{lineCd}_{processCd}_{divisionCd}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    // Trigger this from your business logic to send updates
    public async Task SendLineProduceChange(string groupName, LineProduce lineProduce)
    {
        await Clients.Group(groupName).SendAsync("lineProduceChange", lineProduce);
    }
}
```

## Troubleshooting

### Connection Fails
- Check that the hub URL is correct
- Verify CORS settings on the server
- Check browser console for detailed error messages

### Updates Not Received
- Ensure you've called `joinGroup()` with correct parameters
- Verify the group name matches on client and server
- Check that the server is sending to the correct group

### State Not Updating
- Verify the reducer is registered in StoreModule
- Check that actions are being dispatched
- Use Redux DevTools to inspect state changes
