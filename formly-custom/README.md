# Formly Machine Cards

Custom Formly components with PrimeNG cards for machine configurations.

## Components

- **MachineCardComponent**: PrimeNG p-card with machine-themed header
- **RepeatSectionComponent**: Machine cards with repeat functionality
- **FormlyCardWrapperComponent**: Formly wrapper for cards

## Usage

```typescript
import { FormlyCustomModule } from './formly-custom';

// In your module
imports: [FormlyCustomModule]

// In your component
fields: FormlyFieldConfig[] = [
  {
    key: 'machines',
    type: 'repeat',
    fieldArray: {
      wrappers: ['card'],
      fieldGroup: [
        // your fields
      ]
    }
  }
];
```

## Features

- Machine numbering (Machine-1, Machine-2, etc.)
- Collapsible cards
- Remove functionality
- PrimeNG + Tailwind styling
- Responsive design

## Dependencies

- Angular 15+
- @ngx-formly/core
- PrimeNG (p-card, p-button)
- Tailwind CSS