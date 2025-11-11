import { DynamicField } from './dynamic-field.model';

export interface OptionItem {
  label: string;
  value: any;
  disabled?: boolean;
  [key: string]: any;
}

export interface FormControlState {
  value: any;
  errors: any;
  touched: boolean;
  dirty: boolean;
}

export interface VisibilityState {
  [fieldKey: string]: boolean;
}

export interface FieldState {
  options: OptionItem[];
  suggestions: OptionItem[];
  filteredOptions: OptionItem[];
  isLoading?: boolean;
  error?: string;
}

export interface FormState {
  [fieldKey: string]: FieldState;
}

export interface DynamicFormConfig {
  fields: DynamicField[];
  model?: any;
  submitLabel?: string;
  showSubmitButton?: boolean;
}

export interface FieldChangeEvent {
  field: DynamicField;
  value: any;
  previousValue?: any;
}

export interface FormValidationError {
  field: string;
  error: string;
  errorType: string;
}