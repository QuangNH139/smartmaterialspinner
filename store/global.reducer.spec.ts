import { TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { reducer, GlobalState, selectLineProduces, selectSelectedLineProduce } from './global.reducer';
import { 
  loadLineProduces,
  loadLineProducesSuccess,
  selectLineProduce,
  lineProduceChanged
} from './global.actions';
import { LineProduce } from './models/line-produce.model';

describe('Global Reducer - SignalR Integration', () => {
  let store: Store<{ global: GlobalState }>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({ global: reducer })
      ]
    });

    store = TestBed.inject(Store);
  });

  it('should handle lineProduceChanged action and update lineProduces array', (done) => {
    const mockLineProduce: LineProduce = {
      lineCd: 'LINE001',
      processCd: 'PROC001',
      divisionCd: 'DIV001',
      lineName: 'Production Line 1',
      status: 'Running'
    };

    // Initial load
    store.dispatch(loadLineProducesSuccess({ 
      lineProduces: [mockLineProduce] 
    }));

    // Update via SignalR
    const updatedLineProduce: LineProduce = {
      ...mockLineProduce,
      status: 'Stopped',
      lastUpdated: new Date()
    };

    store.dispatch(lineProduceChanged({ lineProduce: updatedLineProduce }));

    // Verify the update
    store.select(selectLineProduces).subscribe(lineProduces => {
      const updated = lineProduces.find(lp => lp.lineCd === 'LINE001');
      expect(updated?.status).toBe('Stopped');
      done();
    });
  });

  it('should update selectedLineProduce when matching lineCd receives update', (done) => {
    const mockLineProduce: LineProduce = {
      lineCd: 'LINE001',
      processCd: 'PROC001',
      divisionCd: 'DIV001',
      lineName: 'Production Line 1',
      status: 'Running'
    };

    // Load and select
    store.dispatch(loadLineProducesSuccess({ 
      lineProduces: [mockLineProduce] 
    }));
    store.dispatch(selectLineProduce({ lineProduce: mockLineProduce }));

    // Update via SignalR - THIS TESTS LINE 72-76 in global.reducer.ts
    const updatedLineProduce: LineProduce = {
      ...mockLineProduce,
      status: 'Maintenance',
      lastUpdated: new Date()
    };

    store.dispatch(lineProduceChanged({ lineProduce: updatedLineProduce }));

    // Verify selectedLineProduce was updated
    store.select(selectSelectedLineProduce).subscribe(selected => {
      if (selected) {
        expect(selected.status).toBe('Maintenance');
        expect(selected.lineCd).toBe('LINE001');
        done();
      }
    });
  });

  it('should NOT update selectedLineProduce when different lineCd receives update', (done) => {
    const selectedLineProduce: LineProduce = {
      lineCd: 'LINE001',
      processCd: 'PROC001',
      divisionCd: 'DIV001',
      lineName: 'Production Line 1',
      status: 'Running'
    };

    const differentLineProduce: LineProduce = {
      lineCd: 'LINE002',
      processCd: 'PROC002',
      divisionCd: 'DIV002',
      lineName: 'Production Line 2',
      status: 'Running'
    };

    // Load and select LINE001
    store.dispatch(loadLineProducesSuccess({ 
      lineProduces: [selectedLineProduce, differentLineProduce] 
    }));
    store.dispatch(selectLineProduce({ lineProduce: selectedLineProduce }));

    // Update LINE002 via SignalR
    const updatedLine2: LineProduce = {
      ...differentLineProduce,
      status: 'Stopped'
    };

    store.dispatch(lineProduceChanged({ lineProduce: updatedLine2 }));

    // Verify selectedLineProduce remains unchanged
    store.select(selectSelectedLineProduce).subscribe(selected => {
      if (selected) {
        expect(selected.lineCd).toBe('LINE001');
        expect(selected.status).toBe('Running'); // Should NOT be updated
        done();
      }
    });
  });

  it('should add new lineProduce if it does not exist in array', (done) => {
    const existingLineProduce: LineProduce = {
      lineCd: 'LINE001',
      processCd: 'PROC001',
      divisionCd: 'DIV001',
      lineName: 'Production Line 1',
      status: 'Running'
    };

    // Initial load with one item
    store.dispatch(loadLineProducesSuccess({ 
      lineProduces: [existingLineProduce] 
    }));

    // New line produce from SignalR
    const newLineProduce: LineProduce = {
      lineCd: 'LINE002',
      processCd: 'PROC002',
      divisionCd: 'DIV002',
      lineName: 'Production Line 2',
      status: 'Running'
    };

    store.dispatch(lineProduceChanged({ lineProduce: newLineProduce }));

    // Verify the new item was added
    store.select(selectLineProduces).subscribe(lineProduces => {
      expect(lineProduces.length).toBe(2);
      const found = lineProduces.find(lp => lp.lineCd === 'LINE002');
      expect(found).toBeDefined();
      expect(found?.lineName).toBe('Production Line 2');
      done();
    });
  });
});

describe('DowntimeHubService - Integration Tests', () => {
  // Note: These are example test structures
  // Actual implementation would require mocking SignalR HubConnection

  it('should create connection to hub/downtime', () => {
    // Test Step 1: Create connection
    // Mock SignalR connection and verify it's created with correct URL
  });

  it('should join group with correct parameters', async () => {
    // Test Step 2: Join Group
    // Mock hub.invoke and verify JoinGroup is called with LineCd, ProcessCd, DivisionCd
  });

  it('should listen for lineProduceChange events', () => {
    // Test Step 3: Listen server
    // Mock hub.on and verify listener is set up for 'lineProduceChange'
  });

  it('should dispatch action when lineProduceChange event is received', () => {
    // Verify that when hub receives event, it dispatches lineProduceChanged action
  });

  it('should automatically reconnect on connection loss', () => {
    // Test automatic reconnection functionality
  });
});
