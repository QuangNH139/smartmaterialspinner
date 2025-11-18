import { createAction, props } from '@ngrx/store';
import { LineProduce } from './models/line-produce.model';

// Load line produces
export const loadLineProduces = createAction(
  '[Global] Load Line Produces'
);

export const loadLineProducesSuccess = createAction(
  '[Global] Load Line Produces Success',
  props<{ lineProduces: LineProduce[] }>()
);

export const loadLineProducesFailure = createAction(
  '[Global] Load Line Produces Failure',
  props<{ error: string }>()
);

// Select line produce
export const selectLineProduce = createAction(
  '[Global] Select Line Produce',
  props<{ lineProduce: LineProduce }>()
);

// Clear selected line produce
export const clearSelectedLineProduce = createAction(
  '[Global] Clear Selected Line Produce'
);

// SignalR real-time update
export const lineProduceChanged = createAction(
  '[Global] Line Produce Changed',
  props<{ lineProduce: LineProduce }>()
);
