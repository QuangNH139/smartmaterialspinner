interface FormlyFieldConfig {
  key?: string | number;
  parent?: FormlyFieldConfig;
  fieldGroup?: FormlyFieldConfig[];
  model?: any;
  templateOptions?: { [key: string]: any };
  options?: any;
  formControl?: any;
}

interface FormlyFieldProps {
  [additionalProperties: string]: any;
}

abstract class FieldWrapper<F extends FormlyFieldConfig = FormlyFieldConfig> {
  field!: F;
  fieldComponent: any;
  _formlyControls: any;
  _staticContent: any;
  
  get to() { return this.field.templateOptions || {}; }
  get formControl() { return this.field.formControl; }
  get model() { return this.field.model; }
  get key() { return this.field.key; }
  get formState() { return this.field.options?.formState; }
  get showError(): boolean { return false; }
  get options() { return this.field.options || {}; }
}

declare const Component: any;

@Component({
  selector: 'formly-card-wrapper',
  template: `
    <app-machine-card
      [title]="cardTitle"
      [machineNumber]="machineNumber"
      [showRemoveButton]="showRemoveButton"
      [removable]="isRemovable"
      [collapsible]="templateOptions['collapsible'] !== false"
      [collapsed]="templateOptions['collapsed'] || false"
      (remove)="onRemove()"
      (toggle)="onToggle($event)">
      
      <div class="space-y-4">
        <ng-container #fieldComponent></ng-container>
      </div>
    </app-machine-card>
  `,
  standalone: false
})
export class FormlyCardWrapperComponent extends FieldWrapper {
  
  get templateOptions() {
    return (this as any).field?.templateOptions || {};
  }

  get cardTitle(): string {
    return this.templateOptions['cardTitle'] || `Machine ${this.machineNumber}`;
  }
  
  get machineNumber(): number {
    if (this.templateOptions['machineNumber']) {
      return this.templateOptions['machineNumber'];
    }
    
    const field = (this as any).field;
    
    if (field && field.parent && field.parent.fieldGroup && Array.isArray(field.parent.fieldGroup)) {
      const index = field.parent.fieldGroup.findIndex((f: any) => f === field);
      if (index >= 0) {
        return index + 1;
      }
    }
    
    if (field && field.key !== null && field.key !== undefined) {
      if (typeof field.key === 'number') {
        return field.key + 1;
      }
      const keyAsNumber = parseInt(field.key.toString(), 10);
      if (!isNaN(keyAsNumber)) {
        return keyAsNumber + 1;
      }
    }
    
    return 1;
  }

  get showRemoveButton(): boolean {
    if (this.templateOptions['showRemoveButton'] === false) {
      return false;
    }
    
    if (!this.isRemovable) {
      return false;
    }

    return true;
  }

  get isRemovable(): boolean {
    if (this.templateOptions['removable'] === false) {
      return false;
    }

    const totalMachines = this.getTotalMachines();
    
    if (this.templateOptions['minItems'] && typeof this.templateOptions['minItems'] === 'number') {
      return totalMachines > this.templateOptions['minItems'];
    }
    
    return totalMachines > 1;
  }

  private getTotalMachines(): number {
    const field = (this as any).field;
    
    if (field && field.parent && field.parent.fieldGroup && Array.isArray(field.parent.fieldGroup)) {
      return field.parent.fieldGroup.length;
    }
    
    if (field && field.parent && field.parent.model && Array.isArray(field.parent.model)) {
      return field.parent.model.length;
    }

    const rootField = this.getRootField(field);
    if (rootField && rootField.fieldGroup && Array.isArray(rootField.fieldGroup)) {
      for (const subField of rootField.fieldGroup) {
        if (subField && subField.fieldGroup && Array.isArray(subField.fieldGroup)) {
          return subField.fieldGroup.length;
        }
      }
    }
    
    return 1;
  }

  private getRootField(field: any): any {
    if (!field) return null;
    
    let currentField = field;
    while (currentField.parent) {
      currentField = currentField.parent;
    }
    
    return currentField;
  }

  onRemove() {
    if (!this.isRemovable) {
      console.warn('Không thể xóa machine cuối cùng!');
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Không thể xóa machine cuối cùng! Phải có ít nhất 1 machine.');
      }
      return;
    }

    const field = (this as any).field;
    
    if (this.templateOptions['onRemove']) {
      this.templateOptions['onRemove'](field);
      return;
    }

    if (field && field.parent && field.parent.fieldGroup && Array.isArray(field.parent.fieldGroup)) {
      const fieldGroup = field.parent.fieldGroup;
      const index = fieldGroup.findIndex((f: any) => f === field);
      
      if (index >= 0) {
        if (fieldGroup.length <= 1) {
          console.warn('Không thể xóa machine cuối cùng!');
          if (typeof window !== 'undefined' && window.alert) {
            window.alert('Không thể xóa machine cuối cùng! Phải có ít nhất 1 machine.');
          }
          return;
        }

        fieldGroup.splice(index, 1);
        
        if (field.parent.model && Array.isArray(field.parent.model)) {
          if (field.parent.model.length > index) {
            field.parent.model.splice(index, 1);
          }
        }

        this.updateMachineNumbers(fieldGroup);
        this.triggerFormUpdate(field.parent);
      }
    }
  }

  private updateMachineNumbers(fieldGroup: any[]) {
    fieldGroup.forEach((field, index) => {
      if (field && field.templateOptions) {
        field.templateOptions.machineNumber = index + 1;
        field.templateOptions.cardTitle = `Machine ${index + 1}`;
      }
    });
  }

  private triggerFormUpdate(parentField: any) {
    try {
      if (parentField.options && parentField.options.detectChanges) {
        parentField.options.detectChanges();
      }
      
      if (parentField.options && parentField.options.buildForm) {
        parentField.options.buildForm();
      }

      if (parentField.formControl) {
        parentField.formControl.updateValueAndValidity();
      }
    } catch (error) {
      console.warn('Lỗi khi cập nhật form:', error);
    }
  }

  onToggle(collapsed: boolean) {
    if (this.templateOptions) {
      this.templateOptions['collapsed'] = collapsed;
    }

    if (this.templateOptions['onToggle']) {
      this.templateOptions['onToggle'](collapsed, (this as any).field);
    }
  }
}