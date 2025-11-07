import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';
import { isObservable, Observable } from 'rxjs';

@Component({
  selector: 'formly-autocomplete',
  template: `
    <app-autocomplete-field
      [placeholder]="to.placeholder || ''"
      [dropdown]="to['dropdown'] || false"
      [minLength]="to.minLength || 1"
      [options]="getOptions()"
      [value]="formControl.value"
      (valueChange)="formControl.setValue($event)">
    </app-autocomplete-field>
  `,
  standalone:false
})
export class FormlyFieldAutoComplete extends FieldType {
  getOptions(): any[] | ((q: string) => Observable<any[]> | Promise<any[]> | any[]) {
    if (!this.to.options) {
      return [];
    }
    
    if (isObservable(this.to.options)) {
      return () => this.to.options as Observable<any[]>;
    }
    
    return this.to.options;
  }
}
