import { Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'formly-card-wrapper',
  template: `
    <app-machine-card
      [title]="templateOptions['cardTitle'] || 'Machine'"
      [machineNumber]="machineNumber"
      [showRemoveButton]="templateOptions['showRemoveButton'] !== false"
      [removable]="templateOptions['removable'] !== false"
      [collapsible]="templateOptions['collapsible'] !== false"
      [collapsed]="templateOptions['collapsed'] || false"
      (remove)="onRemove()"
      (toggle)="onToggle($event)">
      
      <ng-container #fieldComponent></ng-container>
    </app-machine-card>
  `,
  standalone: false
})
export class FormlyCardWrapperComponent extends FieldWrapper {
  
  get templateOptions() {
    return (this as any).field?.templateOptions || {};
  }
  
  get machineNumber(): number {
    // First check if machineNumber is explicitly set in templateOptions
    if (this.templateOptions['machineNumber']) {
      return this.templateOptions['machineNumber'];
    }
    
    // Try to get the index from the field's key (which should be the array index)
    const field = (this as any).field;
    if (field && field.key !== null && field.key !== undefined) {
      const keyAsNumber = parseInt(field.key.toString(), 10);
      if (!isNaN(keyAsNumber)) {
        return keyAsNumber + 1; // 1-based numbering
      }
    }
    
    // Try to get parent array and find our position
    if (field && field.parent && field.parent.fieldGroup) {
      const index = field.parent.fieldGroup.indexOf(field);
      if (index >= 0) {
        return index + 1;
      }
    }
    
    // Fallback to default
    return 1;
  }

  onRemove() {
    if (this.templateOptions['onRemove']) {
      this.templateOptions['onRemove']();
    }
  }

  onToggle(collapsed: boolean) {
    if (this.templateOptions['onToggle']) {
      this.templateOptions['onToggle'](collapsed);
    }
  }
}