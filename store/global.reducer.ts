import { Action, createReducer, on } from '@ngrx/store';
import { 
  loadLineProduces, 
  loadLineProducesSuccess, 
  loadLineProducesFailure,
  selectLineProduce,
  lineProduceChanged,
  clearSelectedLineProduce
} from './global.actions';
import { LineProduce } from './models/line-produce.model';

export interface GlobalState {
  lineProduces: LineProduce[];
  selectedLineProduce: LineProduce | null;
  loading: boolean;
  error: string | null;
}

export const initialState: GlobalState = {
  lineProduces: [],
  selectedLineProduce: null,
  loading: false,
  error: null
};

const globalReducer = createReducer(
  initialState,
  
  // Load line produces
  on(loadLineProduces, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(loadLineProducesSuccess, (state, { lineProduces }) => ({
    ...state,
    lineProduces,
    loading: false,
    error: null
  })),
  
  on(loadLineProducesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Select line produce
  on(selectLineProduce, (state, { lineProduce }) => ({
    ...state,
    selectedLineProduce: lineProduce
  })),
  
  // Clear selected line produce
  on(clearSelectedLineProduce, (state) => ({
    ...state,
    selectedLineProduce: null
  })),
  
  // Handle real-time update from SignalR
  on(lineProduceChanged, (state, { lineProduce }) => {
    const updatedLineProduces = state.lineProduces.map(lp => 
      lp.lineCd === lineProduce.lineCd ? lineProduce : lp
    );
    
    // If the changed line produce doesn't exist, add it
    const exists = state.lineProduces.some(lp => lp.lineCd === lineProduce.lineCd);
    if (!exists) {
      updatedLineProduces.push(lineProduce);
    }
    
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
);

export function reducer(state: GlobalState | undefined, action: Action) {
  return globalReducer(state, action);
}

// Selectors
export const selectLineProduces = (state: { global: GlobalState }) => state.global.lineProduces;
export const selectSelectedLineProduce = (state: { global: GlobalState }) => state.global.selectedLineProduce;
export const selectLoading = (state: { global: GlobalState }) => state.global.loading;
export const selectError = (state: { global: GlobalState }) => state.global.error;
