# Changelog

## [1.0.0] - 2025-11-11

### Added
- Initial library setup for Angular dynamic form component
- Package configuration with proper metadata and peer dependencies
- TypeScript configuration for library compilation
- ng-packagr configuration for Angular library packaging
- DynamicFormModule for proper component declaration
- PrimeNG module imports (AutoComplete, Button, InputText)
- Public API surface exports
- Comprehensive README with usage examples and API documentation
- BUILD_GUIDE with detailed build and publishing instructions
- .gitignore for build artifacts and dependencies

### Fixed
- TypeScript compilation error in canAdd field comparison logic
- Proper handling of Signal type in canAdd field

### Changed
- Updated canAdd field logic to properly handle boolean, function, Observable, and Signal types

## Library Features
- Dynamic form generation from configuration
- Support for input, select, autocomplete, and repeat field types
- Reactive forms with Angular validators
- Observable-based dynamic options and suggestions
- Conditional field visibility
- Field dependencies and interactions
- Integration with PrimeNG components

## Build Artifacts
- FESM2022 bundles
- ESM2022 modules
- TypeScript declarations (.d.ts files)
- Package tarball (66KB compressed)

## Peer Dependencies
- @angular/common (^17.0.0 || ^18.0.0)
- @angular/core (^17.0.0 || ^18.0.0)
- @angular/forms (^17.0.0 || ^18.0.0)
- primeng (^17.0.0)
- primeicons (^7.0.0)
- rxjs (^7.8.0)
