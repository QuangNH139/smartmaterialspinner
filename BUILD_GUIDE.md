# Building and Using the Library

## Building the Library

To build the library as an external package:

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Create a package tarball
npm run pack
```

This will create:
- `dist/` directory with the compiled library
- `quangnh139-smartmaterialspinner-1.0.0.tgz` package file

## Using the Library in Your Angular Application

### Step 1: Install the Package

You can install the package in three ways:

#### Option 1: From Local Tarball
```bash
npm install /path/to/quangnh139-smartmaterialspinner-1.0.0.tgz
```

#### Option 2: From NPM Registry (after publishing)
```bash
npm install @quangnh139/smartmaterialspinner
```

#### Option 3: From package.json
```json
{
  "dependencies": {
    "@quangnh139/smartmaterialspinner": "file:../path/to/quangnh139-smartmaterialspinner-1.0.0.tgz"
  }
}
```

### Step 2: Import the Module

In your Angular module:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { DynamicFormModule } from '@quangnh139/smartmaterialspinner';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    DynamicFormModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Step 3: Use in Component

```typescript
import { Component } from '@angular/core';
import { DynamicField } from '@quangnh139/smartmaterialspinner';

@Component({
  selector: 'app-root',
  template: `
    <app-dynamic-form-prod
      [fields]="formFields"
      [model]="formModel"
      (formSubmit)="onSubmit($event)">
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
      key: 'email',
      type: 'input',
      label: 'Email',
      placeholder: 'Enter your email',
      required: true
    },
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { label: 'USA', value: 'us' },
        { label: 'UK', value: 'uk' },
        { label: 'Canada', value: 'ca' }
      ]
    }
  ];

  formModel = {};

  onSubmit(formData: any) {
    console.log('Form submitted:', formData);
  }
}
```

## Publishing to NPM Registry

To publish the library to NPM:

```bash
# Build the library
npm run build

# Navigate to dist directory
cd dist

# Login to NPM (if not already logged in)
npm login

# Publish the package
npm publish --access public
```

## Verifying the Build

The successful build should produce:
- ✅ FESM2022 bundles
- ✅ ESM2022 modules
- ✅ TypeScript declarations (.d.ts files)
- ✅ Package metadata (package.json)
- ✅ README documentation

## Dependencies

The library has the following peer dependencies that must be installed in the consuming application:
- `@angular/common` (^17.0.0 || ^18.0.0)
- `@angular/core` (^17.0.0 || ^18.0.0)
- `@angular/forms` (^17.0.0 || ^18.0.0)
- `primeng` (^17.0.0)
- `primeicons` (^7.0.0)
- `rxjs` (^7.8.0)

## Troubleshooting

### Module not found error
Make sure you've installed all peer dependencies:
```bash
npm install @angular/common @angular/core @angular/forms primeng primeicons rxjs
```

### Type errors
Ensure TypeScript version compatibility (TypeScript ~5.2.0 or compatible).

### Build errors
Clean the build artifacts and rebuild:
```bash
rm -rf dist node_modules package-lock.json
npm install
npm run build
```
