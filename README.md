# Smart Material Spinner

A dynamic form component library for Angular with smart material design and PrimeNG integration.

## Features

- Dynamic form generation from configuration
- Support for various field types: input, select, autocomplete, repeat fields
- Reactive forms with validators
- Observable-based dynamic options and suggestions
- Conditional field visibility
- Field dependencies and interactions
- Integration with PrimeNG components

## Installation

```bash
npm install @quangnh139/smartmaterialspinner
```

### Peer Dependencies

This library requires the following peer dependencies:

```bash
npm install @angular/common @angular/core @angular/forms primeng primeicons rxjs
```

## Usage

### Import the Module

First, import the `DynamicFormComponent` in your Angular module:

```typescript
import { DynamicFormComponent } from '@quangnh139/smartmaterialspinner';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    DynamicFormComponent // Import as standalone component
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Basic Example

```typescript
import { Component } from '@angular/core';
import { DynamicField } from '@quangnh139/smartmaterialspinner';

@Component({
  selector: 'app-root',
  template: `
    <app-dynamic-form-prod
      [fields]="formFields"
      [model]="formModel"
      [submitLabel]="'Submit'"
      (formSubmit)="onFormSubmit($event)"
      (formValueChange)="onFormChange($event)">
    </app-dynamic-form-prod>
  `
})
export class AppComponent {
  formFields: DynamicField[] = [
    {
      key: 'name',
      type: 'input',
      label: 'Name',
      placeholder: 'Enter your name',
      required: true
    },
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      placeholder: 'Select country',
      options: [
        { label: 'USA', value: 'us' },
        { label: 'UK', value: 'uk' },
        { label: 'Canada', value: 'ca' }
      ]
    },
    {
      key: 'city',
      type: 'autocomplete',
      label: 'City',
      placeholder: 'Search city',
      options: (query: string) => {
        // Return filtered cities based on query
        return ['New York', 'London', 'Toronto'].filter(city =>
          city.toLowerCase().includes(query?.toLowerCase() || '')
        );
      }
    }
  ];

  formModel = {
    name: '',
    country: '',
    city: ''
  };

  onFormSubmit(formData: any) {
    console.log('Form submitted:', formData);
  }

  onFormChange(formData: any) {
    console.log('Form changed:', formData);
  }
}
```

### Field Types

#### Input Field

```typescript
{
  key: 'email',
  type: 'input',
  label: 'Email',
  placeholder: 'Enter email',
  required: true,
  validators: [Validators.email]
}
```

#### Select Field

```typescript
{
  key: 'status',
  type: 'select',
  label: 'Status',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]
}
```

#### Autocomplete Field

```typescript
{
  key: 'product',
  type: 'autocomplete',
  label: 'Product',
  dropdown: true,
  options: async (query) => {
    const response = await fetch(`/api/products?q=${query}`);
    return response.json();
  }
}
```

#### Repeat Field (Field Array)

```typescript
{
  key: 'addresses',
  type: 'repeat',
  label: 'Addresses',
  addText: 'Add Address',
  fieldArray: {
    title: 'Address',
    fieldGroup: [
      {
        key: 'street',
        type: 'input',
        label: 'Street'
      },
      {
        key: 'city',
        type: 'input',
        label: 'City'
      }
    ]
  }
}
```

## API

### DynamicField Interface

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique identifier for the field |
| `type` | `'input' \| 'select' \| 'autocomplete' \| 'repeat'` | Field type |
| `label` | `string` | Field label |
| `placeholder` | `string` | Placeholder text |
| `required` | `boolean \| Observable<boolean> \| Function` | Whether field is required |
| `options` | `any[] \| Promise<any[]> \| Observable<any[]> \| Function` | Options for select/autocomplete |
| `validators` | `ValidatorFn[]` | Angular validators |
| `visible` | `boolean \| Observable<boolean> \| Function` | Field visibility |
| `className` | `string` | CSS class for field container |

### Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `fields` | `DynamicField[]` | `[]` | Array of field configurations |
| `model` | `any` | `{}` | Initial form values |
| `submitLabel` | `string` | `'Save'` | Submit button label |
| `showSubmitButton` | `boolean` | `true` | Show/hide submit button |

### Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `formSubmit` | `EventEmitter<any>` | Emitted when form is submitted |
| `formValueChange` | `EventEmitter<any>` | Emitted when form value changes |
| `fieldChange` | `EventEmitter<FieldChangeEvent>` | Emitted when individual field changes |

## License

MIT

## Author

QuangNH139
