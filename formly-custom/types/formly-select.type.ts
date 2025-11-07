import { Component } from '@angular/core';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'formly-select',
  template: `
    <app-select-field
      [placeholder]="to.placeholder || ''"
      [options]="to.options || []"
      [filter]="to['filter'] || false"
      [showClear]="to['showClear'] || false"
      [value]="formControl.value"
      (valueChange)="onSelected($event)">
    </app-select-field>
  `,
  standalone:false
})
export class FormlyFieldSelectComponent extends FieldType {
  onSelected(val: any) {
    this.formControl.setValue(val);
    if (this.to['onSelectedStatusChange']) this.to['onSelectedStatusChange'](val);
  }
}
