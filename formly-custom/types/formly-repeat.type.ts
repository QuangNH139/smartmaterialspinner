import { Component } from '@angular/core';
import { FieldArrayType } from '@ngx-formly/core';

@Component({
  selector: 'formly-repeat',
  template: `
    <app-repeat-section
      [items]="field.fieldGroup || []"
      [addText]="to['addText']"
      [canAdd]="to['canAdd'] !== false"
      [max]="to['max']"
      (add)="add()"
      (remove)="remove($event)">
      <ng-container *ngFor="let f of field.fieldGroup" item-content>
        <formly-field [field]="f"></formly-field>
      </ng-container>
    </app-repeat-section>
  `,
  standalone: false
})
export class FormlyRepeatType extends FieldArrayType {
}
