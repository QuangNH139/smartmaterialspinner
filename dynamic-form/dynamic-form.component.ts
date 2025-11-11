import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription, isObservable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DynamicField } from './dynamic-field.model';
import { DynamicFormService } from './dynamic-form.service';
import { OptionItem, VisibilityState, FieldChangeEvent } from './dynamic-form.types';

@Component({
  selector: 'app-dynamic-form-prod',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:false
})
export class DynamicFormComponent implements OnInit, OnDestroy {
  @Input() fields: DynamicField[] = [];
  @Input() submitLabel = 'Save';
  @Input() model: any = {};
  @Input() showSubmitButton = true;
  
  @Output() formValueChange = new EventEmitter<any>();
  @Output() formSubmit = new EventEmitter<any>();
  @Output() fieldChange = new EventEmitter<FieldChangeEvent>();

  form!: FormGroup;
  filteredOptions: Record<string, OptionItem[]> = {};
  optionsObservables: Record<string, Observable<OptionItem[]>> = {};
  suggestions: Record<string, OptionItem[]> = {};
  suggestionsObservables: Record<string, Observable<OptionItem[]>> = {};
  visibilityStates: VisibilityState = {};
  visibilityObservables: Record<string, Observable<boolean>> = {};
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder, 
    private svc: DynamicFormService,
    private cdr: ChangeDetectorRef
  ) {}

  private markForCheck(): void {
    this.cdr.markForCheck();
  }

  private handleAsyncError(operation: string, fieldKey: string, error: any): void {
  }

  private handlePromise<T>(
    promise: Promise<T>, 
    onSuccess: (result: T) => void,
    operation: string,
    fieldKey: string,
    fallbackValue?: T
  ): void {
    promise
      .then(onSuccess)
      .catch((error) => {
        this.handleAsyncError(operation, fieldKey, error);
        if (fallbackValue !== undefined) {
          onSuccess(fallbackValue);
        }
      });
  }

  ngOnInit() {
    this.form = this.buildForm(this.fields);
    this.setupFormValueChanges();
    this.preloadOptions();
    this.preloadSuggestions();
    this.setupVisibilityObservables();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
    
    this.filteredOptions = {};
    this.optionsObservables = {};
    this.suggestions = {};
    this.suggestionsObservables = {};
    this.visibilityStates = {};
    this.visibilityObservables = {};
  }

  getCurrentFormValue(): any {
    return this.form.value;
  }

  isFormValid(): boolean {
    return this.form.valid;
  }

  submitForm(forceSubmit: boolean = false): boolean {
    if (this.form.valid || forceSubmit) {
      this.formSubmit.emit(this.form.value);
      return true;
    } else {
      this.markFormGroupTouched(this.form);
      return false;
    }
  }

  resetForm(newModel?: any): void {
    if (newModel) {
      this.model = newModel;
      this.form.patchValue(newModel);
    } else {
      this.form.reset();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl: any) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  private setupFormValueChanges() {
    const formSub = this.form.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value: any) => {
        this.formValueChange.emit(value);
        this.refreshDynamicOptions(value);
        this.markForCheck();
      });
    this.subscriptions.push(formSub);
  }

  isFieldVisible(field: DynamicField, formValue?: any): boolean {
    const currentFormValue = formValue || this.form?.value || {};

    if (field.visible !== undefined) {
      return this.resolveVisibilityValue(field.visible, currentFormValue, field.key);
    }

    return true;
  }

  private resolveVisibilityValue(visible: any, formValue: any, fieldKey: string): boolean {
    if (typeof visible === 'boolean') {
      return visible;
    }

    if (typeof visible === 'function') {
      try {
        return visible(formValue);
      } catch {
        return true;
      }
    }

    if (isObservable(visible)) {
      const visibilityKey = `visible_${fieldKey}`;
      return this.visibilityStates[visibilityKey] ?? true;
    }

    if (visible && typeof visible === 'object' && 'value' in visible) {
      return visible.value;
    }

    return true;
  }

  isNestedFieldVisible(field: DynamicField, parentField: DynamicField, itemIndex: number): boolean {
    if (field.visible === undefined) {
      return true;
    }

    const formArray = this.form?.get(parentField.key) as FormArray;
    if (formArray && formArray.controls[itemIndex]) {
      const nestedFormGroup = formArray.controls[itemIndex] as FormGroup;
      const nestedFormValue = nestedFormGroup.value;
      return this.resolveVisibilityValue(field.visible, nestedFormValue, field.key);
    }

    return this.isFieldVisible(field);
  }

  private preloadOptions() {
    const all = this.flattenFields(this.fields);
    for (const f of all) {
      if (f.options) {
        if (Array.isArray(f.options)) {
          this.filteredOptions[f.key] = f.options as any[];
        } else if (isObservable(f.options)) {
          this.optionsObservables[f.key] = f.options as Observable<any[]>;
          const optSub = (f.options as Observable<any[]>).subscribe({
            next: (opts: any) => {
              this.filteredOptions[f.key] = opts || [];
              this.markForCheck();
            },
            error: (error: any) => {
              this.handleAsyncError('preloadOptions observable', f.key, error);
              this.filteredOptions[f.key] = [];
              this.markForCheck();
            }
          });
          (optSub as any)._fieldKey = f.key;
          (optSub as any)._type = 'options';
          this.subscriptions.push(optSub);
        } else if (f.options instanceof Promise) {
          this.handlePromise(
            f.options,
            (opts) => { this.filteredOptions[f.key] = opts || []; },
            'preloadOptions',
            f.key,
            []
          );
        } else if (typeof f.options === 'function') {
          try {
            const formData = this.form?.value || {};
            const result = f.options(formData);
            if (Array.isArray(result)) {
              this.filteredOptions[f.key] = result;
            } else if (result instanceof Promise) {
              this.handlePromise(
                result,
                (opts) => { this.filteredOptions[f.key] = opts || []; },
                'preloadOptions',
                f.key,
                []
              );
            } else if (isObservable(result)) {
              this.optionsObservables[f.key] = result;
              const optSub = result.subscribe({
                next: (opts: any) => {
                  this.filteredOptions[f.key] = opts || [];
                },
                error: (error: any) => {
                  this.handleAsyncError('preloadOptions observable', f.key, error);
                  this.filteredOptions[f.key] = [];
                }
              });
              (optSub as any)._fieldKey = f.key;
              (optSub as any)._type = 'options';
              this.subscriptions.push(optSub);
            }
          } catch (error) {
            this.handleAsyncError('preloadOptions function', f.key, error);
            this.filteredOptions[f.key] = [];
          }
        }
      }
    }
  }

  private refreshDynamicOptions(formValue: any) {
    const all = this.flattenFields(this.fields);
    for (const f of all) {
      if (f.options && typeof f.options === 'function') {
        try {
          const result = f.options(formValue);
          
          if (Array.isArray(result)) {
            this.filteredOptions[f.key] = result;
          } else if (isObservable(result)) {
            const existingObservable = this.optionsObservables[f.key];
            if (existingObservable) {
              const subscriptionIndex = this.subscriptions.findIndex(sub => 
                sub && !sub.closed && (sub as any)._fieldKey === f.key && (sub as any)._type === 'options'
              );
              if (subscriptionIndex >= 0) {
                this.subscriptions[subscriptionIndex].unsubscribe();
                this.subscriptions.splice(subscriptionIndex, 1);
              }
            }
            
            this.optionsObservables[f.key] = result;
            const optSub = result.subscribe({
              next: (opts: any) => {
                this.filteredOptions[f.key] = opts || [];
                this.markForCheck();
              },
              error: (error: any) => {
                this.handleAsyncError('refreshDynamicOptions observable', f.key, error);
                this.filteredOptions[f.key] = [];
                this.markForCheck();
              }
            });
            
            (optSub as any)._fieldKey = f.key;
            (optSub as any)._type = 'options';
            this.subscriptions.push(optSub);
          } else if (result && typeof (result as any)?.then === 'function') {
            this.handlePromise(
              result,
              (opts) => { 
                this.filteredOptions[f.key] = opts || [];
                this.markForCheck();
              },
              'refreshDynamicOptions',
              f.key,
              []
            );
          }
        } catch (error) {
          this.handleAsyncError('refreshDynamicOptions function', f.key, error);
          this.filteredOptions[f.key] = [];
        }
      }

      if (f.type === 'autocomplete' && f.suggestions && typeof f.suggestions === 'function') {
        try {
          const result = f.suggestions(formValue);
          
          if (Array.isArray(result)) {
            this.suggestions[f.key] = result;
            this.filteredOptions[f.key] = result;
          } else if (isObservable(result)) {
            const existingSuggObservable = this.suggestionsObservables[f.key];
            if (existingSuggObservable) {
              const subscriptionIndex = this.subscriptions.findIndex(sub => 
                sub && !sub.closed && (sub as any)._fieldKey === f.key && (sub as any)._type === 'suggestions'
              );
              if (subscriptionIndex >= 0) {
                this.subscriptions[subscriptionIndex].unsubscribe();
                this.subscriptions.splice(subscriptionIndex, 1);
              }
            }
            
            this.suggestionsObservables[f.key] = result;
            const suggSub = result.subscribe({
              next: (suggs: any) => {
                this.suggestions[f.key] = suggs || [];
                this.filteredOptions[f.key] = suggs || [];
                this.markForCheck();
              },
              error: (error: any) => {
                this.handleAsyncError('refreshDynamicSuggestions observable', f.key, error);
                this.suggestions[f.key] = [];
                this.filteredOptions[f.key] = [];
                this.markForCheck();
              }
            });
            
            (suggSub as any)._fieldKey = f.key;
            (suggSub as any)._type = 'suggestions';
            this.subscriptions.push(suggSub);
          } else if (result && typeof (result as any)?.then === 'function') {
            this.handlePromise(
              result,
              (suggs) => { 
                this.suggestions[f.key] = suggs || [];
                this.filteredOptions[f.key] = suggs || [];
                this.markForCheck();
              },
              'refreshDynamicSuggestions',
              f.key,
              []
            );
          }
        } catch (error) {
          this.handleAsyncError('refreshDynamicSuggestions function', f.key, error);
          this.suggestions[f.key] = [];
          this.filteredOptions[f.key] = [];
        }
      }
    }
    
    this.refreshNestedDynamicOptions();
  }

  private refreshNestedDynamicOptions() {
    this.fields.forEach(field => {
      if (field.type === 'repeat' && field.fieldArray) {
        const formArray = this.form.get(field.key) as FormArray;
        if (formArray) {
          formArray.controls.forEach((control, index) => {
            const itemFormGroup = control as FormGroup;
            const itemFormData = itemFormGroup.value;
            
            field.fieldArray!.fieldGroup.forEach(nestedField => {
              this.refreshNestedFieldOptions(nestedField, itemFormData, field.key, index);
            });
          });
        }
      }
    });
  }

  private refreshNestedFieldOptions(field: DynamicField, formData: any, parentKey: string, itemIndex: number) {
    const nestedKey = `${parentKey}_${itemIndex}_${field.key}`;
    
    if (field.options && typeof field.options === 'function') {
      try {
        const result = field.options(formData);
        
        if (Array.isArray(result)) {
          this.filteredOptions[nestedKey] = result;
        } else if (isObservable(result)) {
          const existingSubIndex = this.subscriptions.findIndex(sub => 
            sub && !sub.closed && (sub as any)._nestedKey === nestedKey && (sub as any)._type === 'nested-options'
          );
          if (existingSubIndex >= 0) {
            this.subscriptions[existingSubIndex].unsubscribe();
            this.subscriptions.splice(existingSubIndex, 1);
          }
          
          const optSub = result.subscribe({
            next: (opts: any) => {
              this.filteredOptions[nestedKey] = opts || [];
              this.markForCheck();
            },
            error: (error: any) => {
              this.handleAsyncError('refreshNestedFieldOptions', nestedKey, error);
              this.filteredOptions[nestedKey] = [];
              this.markForCheck();
            }
          });
          
          (optSub as any)._nestedKey = nestedKey;
          (optSub as any)._type = 'nested-options';
          this.subscriptions.push(optSub);
        }
      } catch (error) {
        this.handleAsyncError('refreshNestedFieldOptions', nestedKey, error);
        this.filteredOptions[nestedKey] = [];
      }
    }

    if (field.type === 'autocomplete' && field.suggestions && typeof field.suggestions === 'function') {
      try {
        const result = field.suggestions(formData);
        
        if (Array.isArray(result)) {
          this.suggestions[nestedKey] = result;
          this.filteredOptions[nestedKey] = result;
        } else if (isObservable(result)) {
          const existingSubIndex = this.subscriptions.findIndex(sub => 
            sub && !sub.closed && (sub as any)._nestedKey === nestedKey && (sub as any)._type === 'nested-suggestions'
          );
          if (existingSubIndex >= 0) {
            this.subscriptions[existingSubIndex].unsubscribe();
            this.subscriptions.splice(existingSubIndex, 1);
          }
          
          const suggSub = result.subscribe({
            next: (suggs: any) => {
              this.suggestions[nestedKey] = suggs || [];
              this.filteredOptions[nestedKey] = suggs || [];
              this.markForCheck();
            },
            error: (error: any) => {
              this.handleAsyncError('refreshNestedFieldSuggestions', nestedKey, error);
              this.suggestions[nestedKey] = [];
              this.filteredOptions[nestedKey] = [];
              this.markForCheck();
            }
          });
          
          (suggSub as any)._nestedKey = nestedKey;
          (suggSub as any)._type = 'nested-suggestions';
          this.subscriptions.push(suggSub);
        }
      } catch (error) {
        this.handleAsyncError('refreshNestedFieldSuggestions', nestedKey, error);
        this.suggestions[nestedKey] = [];
        this.filteredOptions[nestedKey] = [];
      }
    }
  }

  private preloadSuggestions() {
    const all = this.flattenFields(this.fields);
    
    for (const f of all) {
      if (f.type === 'autocomplete' && f.suggestions) {
        if (Array.isArray(f.suggestions)) {
          this.suggestions[f.key] = f.suggestions;
          this.filteredOptions[f.key] = f.suggestions;
        } else if (isObservable(f.suggestions)) {
          this.suggestionsObservables[f.key] = f.suggestions as Observable<any[]>;
          const suggSub = (f.suggestions as Observable<any[]>).subscribe((suggs: any[]) => {
            this.suggestions[f.key] = suggs || [];
            this.filteredOptions[f.key] = suggs || [];
            this.markForCheck();
          });
          (suggSub as any)._fieldKey = f.key;
          (suggSub as any)._type = 'suggestions';
          this.subscriptions.push(suggSub);
        } else if (f.suggestions && typeof f.suggestions === 'object' && 'value' in f.suggestions) {
          const signalLike = f.suggestions as { value: any };
          const suggestionsList = Array.isArray(signalLike.value) ? signalLike.value : [];
          this.suggestions[f.key] = suggestionsList;
          this.filteredOptions[f.key] = suggestionsList;
        } else if (typeof f.suggestions === 'function') {
          try {
            const formData = this.form?.value || {};
            const result = f.suggestions(formData);
            
            if (Array.isArray(result)) {
              this.suggestions[f.key] = result;
              this.filteredOptions[f.key] = result;
            } else if (isObservable(result)) {
              this.suggestionsObservables[f.key] = result as Observable<OptionItem[]>;
              const suggSub = result.subscribe((suggs: any) => {
                this.suggestions[f.key] = suggs || [];
                this.filteredOptions[f.key] = suggs || [];
                this.markForCheck();
              });
              (suggSub as any)._fieldKey = f.key;
              (suggSub as any)._type = 'suggestions';
              this.subscriptions.push(suggSub);
            } else if (result && typeof (result as any)?.then === 'function') {
              (result as any).then((suggs: any) => {
                this.suggestions[f.key] = suggs || [];
                this.filteredOptions[f.key] = suggs || [];
                this.markForCheck();
              }).catch((error: any) => {
                this.suggestions[f.key] = [];
                this.filteredOptions[f.key] = [];
                this.markForCheck();
              });
            }
          } catch (error) {
            this.suggestions[f.key] = [];
            this.filteredOptions[f.key] = [];
          }
        }
      }
    }
  }

  private setupVisibilityObservables() {
    const all = this.flattenFields(this.fields);
    for (const f of all) {
      if (f.visible && isObservable(f.visible)) {
        const visibilityKey = `visible_${f.key}`;
        this.visibilityObservables[visibilityKey] = f.visible as Observable<boolean>;
        const visSub = (f.visible as Observable<boolean>).subscribe({
          next: (isVisible: boolean) => {
            this.visibilityStates[visibilityKey] = isVisible;
            this.markForCheck();
          },
          error: (error: any) => {
            this.handleAsyncError('setupVisibilityObservables', f.key, error);
            this.visibilityStates[visibilityKey] = true;
            this.markForCheck();
          }
        });
        this.subscriptions.push(visSub);
      }
    }
  }

  private flattenFields(fields: DynamicField[]): DynamicField[] {
    const out: DynamicField[] = [];
    for (const f of fields) {
      out.push(f);
      if (f.type === 'repeat' && f.fieldArray) {
        out.push(...this.flattenFields(f.fieldArray.fieldGroup));
      }
    }
    return out;
  }

  buildForm(fields: DynamicField[]): FormGroup {
    const formControls: { [key: string]: FormControl | FormArray } = {};
    
    for (const field of fields) {
      if (field.type === 'repeat') {
        const formArray = this.fb.array([]);
        
        const arrayChangesSub = formArray.valueChanges.subscribe(() => {
          setTimeout(() => {
            this.refreshNestedDynamicOptions();
          }, 100);
        });
        this.subscriptions.push(arrayChangesSub);
        
        formControls[field.key] = formArray;
      } else {
        const validators = this.buildValidators(field);
        const control = new FormControl(this.model[field.key] || null, validators);
        
        const valueChangesSub = control.valueChanges.subscribe((value: any) => {
          this.onFieldChange(field, value);
        });
        this.subscriptions.push(valueChangesSub);
        
        if (field.required && (isObservable(field.required) || typeof field.required === 'function')) {
          this.setupDynamicRequiredValidation(control, field);
        }
        
        formControls[field.key] = control;
      }
    }
    return this.fb.group(formControls);
  }

  private setupDynamicRequiredValidation(control: FormControl, field: DynamicField): void {
    if (isObservable(field.required)) {
      const requiredSub = (field.required as Observable<boolean>).subscribe((isRequired: boolean) => {
        this.updateRequiredValidation(control, field, isRequired);
      });
      this.subscriptions.push(requiredSub);
    } else if (typeof field.required === 'function') {
      const formSub = this.form?.valueChanges?.subscribe(() => {
        try {
          const formData = this.form?.value || {};
          const isRequired = (field.required as Function)(formData);
          this.updateRequiredValidation(control, field, isRequired);
        } catch {
          this.updateRequiredValidation(control, field, false);
        }
      });
      if (formSub) {
        this.subscriptions.push(formSub);
      }
    }
  }

  private updateRequiredValidation(control: FormControl, field: DynamicField, isRequired: boolean): void {
    const currentValidators = field.validators || [];
    
    if (isRequired) {
      if (!currentValidators.includes(Validators.required)) {
        control.setValidators([Validators.required, ...currentValidators]);
      }
    } else {
      const filteredValidators = currentValidators.filter(v => v !== Validators.required);
      control.setValidators(filteredValidators);
    }
    
    control.updateValueAndValidity();
  }

  private buildValidators(field: DynamicField): any[] {
    const validators: any[] = [];
    
    if (field.required === true) {
      validators.push(Validators.required);
    }
    
    if (field.validators) {
      validators.push(...field.validators);
    }
    
    return validators;
  }

  isFieldRequired(field: DynamicField): boolean {
    if (typeof field.required === 'boolean') {
      return field.required;
    }
    
    if (typeof field.required === 'function') {
      try {
        const formData = this.form?.value || {};
        return field.required(formData);
      } catch {
        return false;
      }
    }
    
    if (isObservable(field.required)) {
      return false;
    }
    
    if (field.required && typeof field.required === 'object' && 'value' in field.required) {
      const signalLike = field.required as { value: boolean };
      return !!signalLike.value;
    }
    
    return false;
  }

  getFormArray(field: DynamicField): FormArray | null {
    if (!field || !field.key || !this.form) {
      return null;
    }
    
    const control = this.form.get(field.key);
    if (!control || !(control instanceof FormArray)) {
      return null;
    }
    
    return control as FormArray;
  }

  addItem(field: DynamicField): boolean {
    if (!field || !field.key || field.type !== 'repeat') {
      return false;
    }

    if (!this.isFieldCanAdd(field)) {
      return false;
    }
    
    const arr = this.getFormArray(field);
    if (!arr) {
      return false;
    }

    const maxItems = this.getFieldMaxItems(field);
    
    if (arr.length >= maxItems) {
      return false;
    }

    if (!field.fieldArray?.fieldGroup) {
      return false;
    }
    
    const itemGroup = this.buildForm(field.fieldArray.fieldGroup);
    arr.push(itemGroup);
    
    this.refreshSuggestionsForNestedFields(field.fieldArray.fieldGroup);
    
    this.fieldChange.emit({ 
      field, 
      value: arr.value,
      previousValue: arr.value.slice(0, -1)
    });
    
    return true;
  }

  private refreshSuggestionsForNestedFields(fields: DynamicField[]): void {
    for (const f of fields) {
      if (f.type === 'autocomplete' && f.suggestions && typeof f.suggestions === 'function') {
        try {
          const formData = this.form?.value || {};
          const result = f.suggestions(formData);
          if (Array.isArray(result)) {
            this.suggestions[f.key] = result;
          } else if (isObservable(result)) {
            if (!this.suggestionsObservables[f.key]) {
              this.suggestionsObservables[f.key] = result;
              const suggSub = result.subscribe((suggs: any) => {
                this.suggestions[f.key] = suggs || [];
                this.markForCheck();
              });
              this.subscriptions.push(suggSub);
            }
          }
          this.markForCheck();
        } catch (error) {
          this.handleAsyncError('refreshSuggestionsForNestedFields', f.key, error);
          this.suggestions[f.key] = [];
        }
      }
    }
  }

  removeItem(field: DynamicField, index: number): boolean {
    if (!field || !field.key || field.type !== 'repeat') {
      return false;
    }

    if (typeof index !== 'number' || index < 0) {
      return false;
    }

    const arr = this.getFormArray(field);
    if (!arr) {
      return false;
    }

    if (index >= arr.length) {
      return false;
    }

    const previousValue = arr.value;
    arr.removeAt(index);
    
    this.fieldChange.emit({ 
      field, 
      value: arr.value,
      previousValue
    });
    
    return true;
  }

  async filterOptions(event: any, field: DynamicField) {
    
    let query = '';
    
    if (typeof event === 'string') {
      query = event;
    } else if (event && typeof event === 'object') {
      query = event.query || event.value || '';
    } else {
      query = '';
    }
    
    
    const formData = this.form?.value || {};
    const lowerQuery = query.toLowerCase();
    
    const shouldCallApi = query && query.length > 0;
    
    const filterByLabel = (items: any[]): any[] => {
      return items.filter((item: any) => {
        const label = typeof item === 'string' ? item : (item[field.optionLabel || 'label'] || item.toString());
        return label.toLowerCase().includes(lowerQuery);
      });
    };

    try {
      let optionsToFilter: any[] = [];

      if (field.suggestions) {
        if (Array.isArray(field.suggestions)) {
          optionsToFilter = field.suggestions;
        } else if (typeof field.suggestions === 'function') {
          if (shouldCallApi) {
            const searchFormData = { ...formData, _searchQuery: query };
            const result = field.suggestions(searchFormData);
            
            
            if (Array.isArray(result)) {
              optionsToFilter = result;
              this.suggestions[field.key] = result;
            } else if (isObservable(result)) {
              const subscription = result.subscribe((suggs: any) => {
                this.suggestions[field.key] = suggs || [];
                this.filteredOptions[field.key] = suggs || [];
                this.markForCheck();
              });
              this.subscriptions.push(subscription);
            } else if (result && typeof (result as any)?.then === 'function') {
              try {
                const resolvedSuggestions = await (result as any);
                optionsToFilter = resolvedSuggestions || [];
                this.suggestions[field.key] = resolvedSuggestions || [];
              } catch (error) {
                console.error('Promise suggestions error:', error);
                this.handleAsyncError('filterOptions async suggestions', field.key, error);
                optionsToFilter = [];
              }
            }
          } else {
            optionsToFilter = this.suggestions[field.key] || [];
          }
        } else if (this.suggestionsObservables[field.key]) {
          optionsToFilter = this.suggestions[field.key] || [];
        } else if (typeof field.suggestions === 'object' && 'value' in field.suggestions) {
          const signalLike = field.suggestions as { value: any };
          optionsToFilter = Array.isArray(signalLike.value) ? signalLike.value : [];
        }
      } else if (field.options) {
        if (Array.isArray(field.options)) {
          optionsToFilter = field.options;
        } else if (typeof field.options === 'function') {
          if (shouldCallApi) {
            const searchFormData = { ...formData, _searchQuery: query };
            const result = field.options(searchFormData);
            
            if (Array.isArray(result)) {
              optionsToFilter = result;
            } else if (isObservable(result)) {
              const subscription = result.subscribe((opts: any) => {
                this.filteredOptions[field.key] = opts || [];
                this.markForCheck();
              });
              this.subscriptions.push(subscription);
              return;
            } else if (result && typeof (result as any)?.then === 'function') {
              try {
                const resolvedOpts = await (result as any);
                optionsToFilter = resolvedOpts || [];
              } catch (error) {
                this.handleAsyncError('filterOptions async options', field.key, error);
                optionsToFilter = [];
              }
            }
          } else {
            optionsToFilter = this.filteredOptions[field.key] || [];
          }
        } else if (isObservable(field.options)) {
          optionsToFilter = this.filteredOptions[field.key] || [];
        } else if (field.options instanceof Promise) {
          try {
            const resolvedOpts = await field.options;
            optionsToFilter = resolvedOpts || [];
          } catch (error) {
            this.handleAsyncError('filterOptions promise options', field.key, error);
            optionsToFilter = [];
          }
        } else {
          optionsToFilter = [];
        }
      }

      this.filteredOptions[field.key] = shouldCallApi ? optionsToFilter : filterByLabel(optionsToFilter);
      this.markForCheck();
    } catch (error) {
      console.error('filterOptions error:', error);
      this.handleAsyncError('filterOptions', field.key, error);
      this.filteredOptions[field.key] = [];
      this.markForCheck();
    }
  }

  onFieldChange(field: DynamicField, value: any) {
    this.fieldChange.emit({ field, value });
    field.onChange?.(value, field);
    
    if (field.type === 'select' || field.type === 'autocomplete') {
      field.onSelectedStatusChange?.(value);
    }
  }

  onSelectChange(field: DynamicField, event: any) {
    const value = event?.value ?? event;
    this.onFieldChange(field, value);
  }

  onNestedSelectChange(field: DynamicField, event: any, parentKey: string, itemIndex: number) {
    const value = event?.target?.value ?? event?.value ?? event;
    this.onFieldChange(field, value);
    
    this.refreshSingleNestedContext(parentKey, itemIndex);
  }

  private refreshSingleNestedContext(parentKey: string, itemIndex: number) {
    const parentField = this.fields.find(f => f.key === parentKey);
    if (parentField && parentField.type === 'repeat' && parentField.fieldArray) {
      const formArray = this.form.get(parentKey) as FormArray;
      if (formArray && formArray.controls[itemIndex]) {
        const itemFormGroup = formArray.controls[itemIndex] as FormGroup;
        const itemFormData = itemFormGroup.value;
        
        parentField.fieldArray.fieldGroup.forEach(nestedField => {
          this.refreshNestedFieldOptions(nestedField, itemFormData, parentKey, itemIndex);
        });
      }
    }
  }

  filterNestedOptions(event: any, field: DynamicField, parentKey: string, itemIndex: number) {
    const nestedKey = `${parentKey}_${itemIndex}_${field.key}`;
    const query = event.query || '';
    
    if (field.suggestions && typeof field.suggestions === 'function') {
      const formArray = this.form.get(parentKey) as FormArray;
      if (formArray && formArray.controls[itemIndex]) {
        const itemFormGroup = formArray.controls[itemIndex] as FormGroup;
        const itemFormData = { ...itemFormGroup.value, _searchQuery: query };
        
        try {
          const result = field.suggestions(itemFormData);
          
          if (isObservable(result)) {
            const sub = result.subscribe((suggs: any) => {
              this.filteredOptions[nestedKey] = suggs || [];
              this.markForCheck();
            });
            this.subscriptions.push(sub);
          } else if (Array.isArray(result)) {
            this.filteredOptions[nestedKey] = result;
          }
        } catch (error) {
          this.filteredOptions[nestedKey] = [];
        }
      }
    } else {
      const allOptions = this.filteredOptions[nestedKey] || [];
      this.filteredOptions[nestedKey] = allOptions.filter((option: any) =>
        option.label?.toLowerCase().includes(query.toLowerCase()) ||
        option.value?.toString().toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  onNestedAutocompleteDropdownClick(field: DynamicField, parentKey: string, itemIndex: number): void {
    this.filterNestedOptions({ query: '' }, field, parentKey, itemIndex);
  }

  onInputBlur(field: DynamicField, event: any) {
    const value = event?.target?.value ?? event;
    field.onBlur?.(value, field);
  }

  onInputFocus(field: DynamicField, event: any) {
    const value = event?.target?.value ?? event;
    field.onFocus?.(value, field);
  }

  onSubmit() {
    this.markFormGroupTouched(this.form);
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    }
  }

  onAutoCompleteSearch(event: any, field: DynamicField) {
    this.filterOptions(event, field);
  }

  onAutocompleteDropdownClick(field: DynamicField): void {
    this.filterOptions({ query: '' }, field);
    
    if (field.suggestions && typeof field.suggestions === 'function') {
      try {
        const formData = this.form?.value || {};
        const result = field.suggestions(formData);
        
        if (isObservable(result)) {
          if (!this.suggestionsObservables[field.key]) {
            this.suggestionsObservables[field.key] = result;
            const sub = result.subscribe((suggs: any) => {
              this.suggestions[field.key] = suggs || [];
              this.filteredOptions[field.key] = suggs || [];
              this.markForCheck();
            });
            this.subscriptions.push(sub);
          }
        }
      } catch (error) {
        this.handleAsyncError('onAutocompleteDropdownClick', field.key, error);
      }
    }
  }

  getFilteredOptionsForField(field: DynamicField): OptionItem[] {
    return this.filteredOptions[field.key] || [];
  }

  getFieldSuggestions(field: DynamicField): OptionItem[] {
    console.warn(field);
    if (field.suggestions) {
      if (Array.isArray(field.suggestions)) {
        return field.suggestions;
      } else if (this.suggestionsObservables[field.key]) {
        return this.suggestions[field.key] || [];
      } else if (field.suggestions && typeof field.suggestions === 'object' && 'value' in field.suggestions) {
        const signalLike = field.suggestions as { value: any };
        return Array.isArray(signalLike.value) ? signalLike.value : [];
      } else if (typeof field.suggestions === 'function') {
        const cached = this.suggestions[field.key];
        if (cached && cached.length > 0) {
          return cached;
        }
        
        try {
          const formData = this.form?.value || {};
          const result = field.suggestions(formData);
          
          if (Array.isArray(result)) {
            this.suggestions[field.key] = result;
            return result;
          } else if (isObservable(result)) {
            if (!this.suggestionsObservables[field.key]) {
              this.suggestionsObservables[field.key] = result;
              const sub = result.subscribe((suggs: any) => {
                this.suggestions[field.key] = suggs || [];
                this.filteredOptions[field.key] = suggs || [];
                this.markForCheck();
              });
              this.subscriptions.push(sub);
            }
            return this.suggestions[field.key] || [];
          }
        } catch (error) {
          return [];
        }
      }
    }
    
    return this.filteredOptions[field.key] || [];
  }

  getSafeFieldSuggestions(field: DynamicField): OptionItem[] {
    try {
      return this.getFieldSuggestions(field) || [];
    } catch {
      return [];
    }
  }

  getSafeFormArrayControls(field: DynamicField): any[] {
    try {
      return this.getFormArray(field)?.controls || [];
    } catch {
      return [];
    }
  }

  isFieldCanAdd(field: DynamicField): boolean {
    if (typeof field.canAdd === 'boolean') {
      return field.canAdd;
    }
    
    if (typeof field.canAdd === 'function') {
      try {
        const formData = this.form?.value || {};
        return field.canAdd(formData);
      } catch {
        return true;
      }
    }
    
    if (isObservable(field.canAdd)) {
      return true;
    }
    
    if (field.canAdd && typeof field.canAdd === 'object' && 'value' in field.canAdd) {
      const signalLike = field.canAdd as { value: boolean };
      return !!signalLike.value;
    }
    
    return field.canAdd !== false;
  }

  getFieldMaxItems(field: DynamicField): number {
    if (typeof field.max === 'number') {
      return field.max;
    }
    
    if (typeof field.max === 'function') {
      try {
        const formData = this.form?.value || {};
        return field.max(formData);
      } catch {
        return 10;
      }
    }
    
    if (field.max && typeof field.max === 'object' && 'value' in field.max) {
      const signalLike = field.max as { value: number };
      return typeof signalLike.value === 'number' ? signalLike.value : 10;
    }
    
    return typeof field.max === 'number' ? field.max : 10;
  }

  hasObservableSuggestions(field: DynamicField): boolean {
    return !!this.suggestionsObservables[field.key];
  }

  getFieldOptions(field: DynamicField): OptionItem[] {
    return this.filteredOptions[field.key] || [];
  }

  getNestedFieldOptions(field: DynamicField, parentKey: string, itemIndex: number): OptionItem[] {
    const nestedKey = `${parentKey}_${itemIndex}_${field.key}`;
    return this.filteredOptions[nestedKey] || this.filteredOptions[field.key] || [];
  }

  getNestedFilteredOptionsForField(field: DynamicField, parentKey: string, itemIndex: number): OptionItem[] {
    const nestedKey = `${parentKey}_${itemIndex}_${field.key}`;
    return this.filteredOptions[nestedKey] || this.filteredOptions[field.key] || [];
  }

  private generateErrorMessage(field: DynamicField, errors: any): string {
    const fieldName = field.label || field.key;
    
    const errorMessages: { [key: string]: (error: any) => string } = {
      required: () => `${fieldName} is required`,
      email: () => `${fieldName} must be a valid email`,
      minlength: (err) => `${fieldName} must be at least ${err.requiredLength} characters`,
      maxlength: (err) => `${fieldName} must not exceed ${err.requiredLength} characters`,
      pattern: () => `${fieldName} format is invalid`,
      min: (err) => `${fieldName} must be at least ${err.min}`,
      max: (err) => `${fieldName} must not exceed ${err.max}`
    };

    for (const errorKey of Object.keys(errors)) {
      if (field.errorMessages?.[errorKey]) {
        return field.errorMessages[errorKey];
      }
      if (errorMessages[errorKey]) {
        return errorMessages[errorKey](errors[errorKey]);
      }
    }

    return `${fieldName} is invalid`;
  }

  getFieldErrorMessage(field: DynamicField): string {
    const control = this.form.get(field.key);
    if (!control?.errors || !control?.touched) {
      return '';
    }
    return this.generateErrorMessage(field, control.errors);
  }

  hasFieldError(field: DynamicField): boolean {
    const control = this.form.get(field.key);
    return !!(control?.errors && control?.touched);
  }

  getNestedFieldErrorMessage(parentField: DynamicField, nestedField: DynamicField, index: number): string {
    const parentArray = this.form.get(parentField.key) as FormArray;
    if (!parentArray || index >= parentArray.length) {
      return '';
    }

    const nestedGroup = parentArray.at(index) as FormGroup;
    const control = nestedGroup?.get(nestedField.key);
    
    if (!control?.errors || !control?.touched) {
      return '';
    }

    return this.generateErrorMessage(nestedField, control.errors);
  }

  hasNestedFieldError(parentField: DynamicField, nestedField: DynamicField, index: number): boolean {
    const parentArray = this.form.get(parentField.key) as FormArray;
    if (!parentArray || index >= parentArray.length) {
      return false;
    }

    const nestedGroup = parentArray.at(index) as FormGroup;
    const control = nestedGroup?.get(nestedField.key);
    return !!(control?.errors && control?.touched);
  }
}