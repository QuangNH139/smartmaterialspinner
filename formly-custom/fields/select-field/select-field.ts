import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable, of, from, isObservable } from 'rxjs';

@Component({
  selector: 'app-select-field',
  templateUrl: './select-field.html',
  styleUrl: './select-field.scss',
  standalone: false,
})
export class SelectFieldComponent {
  @Input() placeholder = '';
  @Input() options!: Observable<any[]> | Promise<any[]> | any[];
  @Input() filter = false;
  @Input() showClear = true;
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  options$: Observable<any[]> = of([]);

  ngOnInit() {
    const src = this.options;
    if (src instanceof Promise) this.options$ = from(src);
    else if (isObservable(src)) this.options$ = src;
    else if (Array.isArray(src)) this.options$ = of(src);
    else this.options$ = of([]);
  }

  onChange(e: any) {
    this.valueChange.emit(e.value);
  }
}
