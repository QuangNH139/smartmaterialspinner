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
  styleUrl: './autocomplete-field.scss',
  standalone: false,
})
export class AutocompleteFieldComponent {
  @Input() placeholder = '';
  @Input() dropdown = false;
  @Input() minLength = 1;
  @Input() field = 'label';
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
    const q = event?.query ?? '';
    this.loading = true;
    this.query$.next(q);
  }

  fetchOptions(query: string): Observable<any[]> {
    if (!this.options) return of([]);

    // static array
    if (Array.isArray(this.options)) {
      return of(
        this.options.filter((i: any) =>
          (i.label ?? i).toString().toLowerCase().includes(query.toLowerCase())
        )
      );
    }

    // function
    if (typeof this.options === 'function') {
      const result = this.options(query);

      if (result instanceof Promise) return from(result);
      if (isObservable(result)) return result as Observable<any[]>;
      if (Array.isArray(result)) return of(result);

      return of([]);
    }

    // observable
    if (isObservable(this.options)) {
      return this.options as Observable<any[]>;
    }

    return of([]);
  }
}
