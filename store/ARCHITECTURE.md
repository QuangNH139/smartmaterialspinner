# SignalR Integration Architecture

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Angular)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Component (downtime-monitor.component.ts)      │    │
│  │                                                          │    │
│  │  1. ngOnInit():                                         │    │
│  │     - createConnection()                                │    │
│  │     - joinGroup(LineCd, ProcessCd, DivisionCd)         │    │
│  │     - Subscribe to lineProduces$                        │    │
│  │     - Subscribe to selectedLineProduce$                 │    │
│  └────────────────┬──────────────────────┬─────────────────┘    │
│                   │                      │                       │
│                   ▼                      ▼                       │
│  ┌────────────────────────┐   ┌──────────────────────────┐     │
│  │  DowntimeHubService    │   │    NgRx Store            │     │
│  │                        │   │  (global.reducer.ts)     │     │
│  │  Step 1: Create        │   │                          │     │
│  │  Connection            │   │  State:                  │     │
│  │  └─> hub/downtime      │   │  - lineProduces[]        │     │
│  │                        │   │  - selectedLineProduce   │     │
│  │  Step 2: Join Group    │   │  - loading               │     │
│  │  └─> JoinGroup()       │   │  - error                 │     │
│  │      (LineCd,          │   │                          │     │
│  │       ProcessCd,       │   │  Line 72: Handles        │     │
│  │       DivisionCd)      │   │  real-time update        │     │
│  │                        │   │  when lineProduceChange  │     │
│  │  Step 3: Listen        │   │  is received             │     │
│  │  └─> on('lineProduce   │   │                          │     │
│  │         Change')       │   │                          │     │
│  │      │                 │   │                          │     │
│  │      └─> dispatch      │───┼─>  lineProduceChanged    │     │
│  │          action        │   │     action               │     │
│  └────────────┬───────────┘   └──────────┬───────────────┘     │
│               │                           │                      │
│               │                           │ State Updates        │
│               │                           └──────────────────┐   │
│               │                                              │   │
│               │ SignalR Events                               ▼   │
│               │                           Observables emit    │   │
│               │                           new values          │   │
│               │                           - lineProduces$     │   │
│               │                           - selectedLine...   │   │
└───────────────┼──────────────────────────────────────────────────┘
                │
                │ WebSocket
                │ Connection
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server (ASP.NET Core)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              DowntimeHub (SignalR Hub)                  │    │
│  │                                                          │    │
│  │  Methods:                                               │    │
│  │  - JoinGroup(lineCd, processCd, divisionCd)            │    │
│  │  - LeaveGroup(lineCd, processCd, divisionCd)           │    │
│  │  - SendLineProduceChange(groupName, lineProduce)       │    │
│  │                                                          │    │
│  │  Events Sent to Client:                                 │    │
│  │  - lineProduceChange(LineProduce data)                 │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Flow

### 1. Initialization

```typescript
// Component initialization
ngOnInit() {
  // Create SignalR connection to hub/downtime
  this.downtimeHubService.createConnection();
  
  // Subscribe to store observables
  this.lineProduces$ = this.store.select(selectLineProduces);
  this.selectedLineProduce$ = this.store.select(selectSelectedLineProduce);
}
```

### 2. Group Subscription

```typescript
// Join a specific group
await this.downtimeHubService.joinGroup('LINE001', 'PROC001', 'DIV001');
```

Server receives and adds client to group:
```csharp
public async Task JoinGroup(string lineCd, string processCd, string divisionCd)
{
    var groupName = $"{lineCd}_{processCd}_{divisionCd}";
    await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
}
```

### 3. Real-time Updates

When server detects a change:

```csharp
// Server sends update to group
await Clients.Group(groupName).SendAsync("lineProduceChange", updatedLineProduce);
```

Client receives and processes:

```typescript
// DowntimeHubService (downtime-hub.service.ts)
this.hubConnection.on('lineProduceChange', (lineProduce: LineProduce) => {
  // Dispatch action to store
  this.store.dispatch(lineProduceChanged({ lineProduce }));
});
```

Reducer updates state (line 62-83 in global.reducer.ts):

```typescript
on(lineProduceChanged, (state, { lineProduce }) => {
  // Update lineProduces array
  const updatedLineProduces = state.lineProduces.map(lp => 
    lp.lineCd === lineProduce.lineCd ? lineProduce : lp
  );
  
  // Update selectedLineProduce if it matches (LINE 72-76)
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

### 4. Component Reacts

```typescript
// Component subscriptions automatically receive updates
this.lineProduces$.subscribe(lineProduces => {
  // UI automatically updates via async pipe
  // or handle in subscription
});

this.selectedLineProduce$.subscribe(selected => {
  // UI automatically updates
  // or handle in subscription
});
```

## Key Points

### Line 72 Significance

Line 72-76 in `global.reducer.ts` is crucial because it:

1. **Maintains Consistency**: When a line produce changes via SignalR, it checks if the changed item is currently selected
2. **Updates Both States**: Updates both the `lineProduces` array AND `selectedLineProduce` if they match
3. **Preserves Selection**: If the changed line produce is not the selected one, the selection remains unchanged
4. **Real-time Sync**: Ensures the UI always shows the latest data for both the list and the selected item

### Benefits

1. **Automatic Updates**: Components don't need to poll - they receive updates instantly
2. **Type Safety**: Full TypeScript support with interfaces
3. **Reactive**: Uses RxJS observables for clean, reactive programming
4. **Scalable**: Can easily add more listeners or groups
5. **Resilient**: Automatic reconnection on connection loss

## Integration Points

### In Your Module

```typescript
@NgModule({
  imports: [
    GlobalStoreModule,  // Includes reducer and service
    // ...
  ]
})
```

### In Your Component

```typescript
constructor(
  private store: Store,
  private downtimeHubService: DowntimeHubService
) {}
```

### Requirements

- `@ngrx/store` for state management
- `@microsoft/signalr` for SignalR client
- Angular 17+ (or adjust based on your version)

## Testing Scenarios

1. **Connection Test**: Verify connection establishes successfully
2. **Group Join Test**: Confirm JoinGroup succeeds with correct parameters
3. **Event Reception Test**: Trigger server event and verify state updates
4. **Selection Update Test**: Verify selectedLineProduce updates when it matches changed lineCd
5. **Multiple Updates Test**: Send multiple events and verify all are processed
6. **Reconnection Test**: Disconnect and verify automatic reconnection
