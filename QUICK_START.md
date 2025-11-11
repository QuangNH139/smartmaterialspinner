# Quick Start Guide

## Build the Library
```bash
npm install
npm run build
```

## Package the Library
```bash
npm run pack
```

## Full Build & Verify
```bash
npm run verify
```

## Use in Your Angular App

### 1. Install
```bash
npm install @quangnh139/smartmaterialspinner
```

### 2. Import Module
```typescript
import { DynamicFormModule } from '@quangnh139/smartmaterialspinner';

@NgModule({
  imports: [DynamicFormModule]
})
export class AppModule { }
```

### 3. Use Component
```typescript
import { DynamicField } from '@quangnh139/smartmaterialspinner';

export class MyComponent {
  fields: DynamicField[] = [
    {
      key: 'name',
      type: 'input',
      label: 'Name',
      required: true
    },
    {
      key: 'email',
      type: 'input',
      label: 'Email',
      placeholder: 'you@example.com'
    },
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { label: 'USA', value: 'us' },
        { label: 'UK', value: 'uk' }
      ]
    }
  ];
}
```

```html
<app-dynamic-form-prod
  [fields]="fields"
  [model]="{}"
  (formSubmit)="onSubmit($event)">
</app-dynamic-form-prod>
```

## Available Scripts
- `npm run build` - Build the library
- `npm run pack` - Create package tarball
- `npm run clean` - Remove build artifacts
- `npm run rebuild` - Clean and rebuild
- `npm run verify` - Build and create package

## Output
- **dist/** - Built library files
- **quangnh139-smartmaterialspinner-1.0.0.tgz** - Package tarball

## Documentation
- **README.md** - Full documentation
- **BUILD_GUIDE.md** - Detailed build instructions
- **CHANGELOG.md** - Version history
- **IMPLEMENTATION_SUMMARY.md** - Technical details

## Support
For issues and questions, visit: https://github.com/QuangNH139/smartmaterialspinner
