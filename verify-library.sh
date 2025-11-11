#!/bin/bash
set -e

echo "============================================"
echo "Library Verification Script"
echo "============================================"
echo ""

echo "1. Checking package.json..."
if [ -f "package.json" ]; then
  echo "   ✓ package.json exists"
  PACKAGE_NAME=$(node -p "require('./package.json').name")
  PACKAGE_VERSION=$(node -p "require('./package.json').version")
  echo "   ✓ Package: $PACKAGE_NAME@$PACKAGE_VERSION"
else
  echo "   ✗ package.json not found"
  exit 1
fi

echo ""
echo "2. Checking TypeScript configuration..."
[ -f "tsconfig.json" ] && echo "   ✓ tsconfig.json exists" || exit 1
[ -f "tsconfig.lib.json" ] && echo "   ✓ tsconfig.lib.json exists" || exit 1

echo ""
echo "3. Checking Angular configuration..."
[ -f "ng-package.json" ] && echo "   ✓ ng-package.json exists" || exit 1
[ -f "public-api.ts" ] && echo "   ✓ public-api.ts exists" || exit 1

echo ""
echo "4. Checking source files..."
[ -f "dynamic-form/dynamic-form.component.ts" ] && echo "   ✓ Component exists" || exit 1
[ -f "dynamic-form/dynamic-form.module.ts" ] && echo "   ✓ Module exists" || exit 1
[ -f "dynamic-form/dynamic-form.service.ts" ] && echo "   ✓ Service exists" || exit 1

echo ""
echo "5. Checking documentation..."
[ -f "README.md" ] && echo "   ✓ README.md exists" || exit 1
[ -f "BUILD_GUIDE.md" ] && echo "   ✓ BUILD_GUIDE.md exists" || exit 1
[ -f "QUICK_START.md" ] && echo "   ✓ QUICK_START.md exists" || exit 1
[ -f "CHANGELOG.md" ] && echo "   ✓ CHANGELOG.md exists" || exit 1
[ -f "LICENSE" ] && echo "   ✓ LICENSE exists" || exit 1

echo ""
echo "6. Checking build output..."
if [ -d "dist" ]; then
  echo "   ✓ dist/ directory exists"
  [ -f "dist/package.json" ] && echo "   ✓ dist/package.json exists" || exit 1
  [ -d "dist/fesm2022" ] && echo "   ✓ FESM2022 bundles exist" || exit 1
  [ -d "dist/esm2022" ] && echo "   ✓ ESM2022 modules exist" || exit 1
  [ -f "dist/index.d.ts" ] && echo "   ✓ Type definitions exist" || exit 1
else
  echo "   ✗ dist/ directory not found"
  exit 1
fi

echo ""
echo "7. Checking package tarball..."
TARBALL=$(ls *.tgz 2>/dev/null | head -1)
if [ -n "$TARBALL" ]; then
  echo "   ✓ Package tarball exists: $TARBALL"
  SIZE=$(du -h "$TARBALL" | cut -f1)
  echo "   ✓ Package size: $SIZE"
else
  echo "   ✗ Package tarball not found"
  exit 1
fi

echo ""
echo "============================================"
echo "✅ All checks passed!"
echo "============================================"
echo ""
echo "Library is ready to use!"
echo "Install with: npm install ./$TARBALL"
