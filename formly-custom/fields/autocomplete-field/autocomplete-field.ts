import { Component, Input, Output, EventEmitter } from '@angular/core';
import { from, isObservable, Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';

@Component({
  selector: 'app-autocomplete-field',
  templateUrl: './autocomplete-field.html',
  standalone: false,
})
export class AutocompleteFieldComponent {
  @Input() placeholder = '';
  @Input() dropdown = false;
  @Input() minLength = 1;
  @Input() options!:
    | ((q: string) => Observable<any[]> | Promise<any[]> | any[])
    | any[];
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  loading = false;
  suggestions: any[] = [];
  private query$ = new Subject<string>();

  constructor() {
    this.query$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => this.fetchOptions(q)),
        catchError(() => of([]))
      )
      .subscribe((data) => {
        this.suggestions = data || [];
        this.loading = false;
      });
  }

  onComplete(event: any) {
    this.loading = true;
    this.query$.next(event?.query ?? '');
  }

  private fetchOptions(query: string): Observable<any[]> {
    if (!this.options) return of([]);

    if (Array.isArray(this.options)) {
      return of(
        this.options.filter((item: any) =>
          (item.label ?? item).toString().toLowerCase().includes(query.toLowerCase())
        )
      );
    }

    if (typeof this.options === 'function') {
      const result = this.options(query);

      if (result instanceof Promise) return from(result);
      if (isObservable(result)) return result as Observable<any[]>;
      if (Array.isArray(result)) return of(result);
    }

    if (isObservable(this.options)) {
      return this.options as Observable<any[]>;
    }

    return of([]);
  }
}
