import { Observable } from 'rxjs';
import { ValidatorFn } from '@angular/forms';

export interface Signal<T> {
  value: T;
}

export interface DynamicField {
  key: string;
  type: 'input' | 'select' | 'autocomplete' | 'repeat';
  label?: string;
  placeholder?: string;
  className?: string;
  options?:
    | any[]
    | Promise<any[]>
    | Observable<any[]>
    | ((query?: string) => any[] | Promise<any[]> | Observable<any[]>)
    | ((formData?: any) => any[] | Promise<any[]> | Observable<any[]>);
  required?: 
    | boolean 
    | Observable<boolean> 
    | Signal<boolean> 
    | (() => boolean)
    | ((formData?: any) => boolean);
  addText?: string;
  canAdd?: 
    | boolean 
    | Observable<boolean> 
    | Signal<boolean> 
    | (() => boolean)
    | ((formData?: any) => boolean);
  max?: 
    | number 
    | Observable<number> 
    | Signal<number> 
    | (() => number)
    | ((formData?: any) => number);
  
  suggestions?: 
    | any[] 
    | Observable<any[]> 
    | Signal<any[]>
    | ((formData?: any) => any[])
    | ((formData?: any) => Observable<any[]>);
  
  visible?: 
    | boolean 
    | Observable<boolean> 
    | (() => boolean) 
    | any
    | ((formData?: any) => boolean);

  validators?: ValidatorFn[];
  errorMessages?: {
    [key: string]: string;
  };

  onSelectedStatusChange?: (value: any) => void;
  onChange?: (value: any, field: DynamicField) => void;
  onBlur?: (value: any, field: DynamicField) => void;
  onFocus?: (value: any, field: DynamicField) => void;

  optionLabel?: string;
  optionValue?: string;
  filter?: boolean;
  showClear?: boolean;
  dropdown?: boolean;
  minLength?: number;
  
  fieldArray?: {
    title?: string;
    fieldGroup: DynamicField[];
  };
}