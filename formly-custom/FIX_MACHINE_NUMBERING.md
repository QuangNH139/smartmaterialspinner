# Fix cho lỗi gộp field vào machine2 khi tạo machine mới

## Vấn đề
Khi tạo machine mới trong form Formly, các field bị gộp chung vào "machine2" thay vì tạo các machine riêng biệt với số thứ tự đúng (Machine-1, Machine-2, Machine-3, ...).

## Nguyên nhân
Vấn đề nằm ở `FormlyCardWrapperComponent` trong file `/formly-custom/wrappers/formly-card-wrapper.ts`. Wrapper này sử dụng giá trị cố định `machineNumber = 1` cho tất cả các card, không phân biệt được index của từng item trong array.

## Giải pháp đã implement

### 1. Cập nhật FormlyCardWrapperComponent
Đã thay đổi logic để tự động detect machine number từ:
- Field key (array index)  
- Vị trí trong parent fieldGroup
- Template options (nếu được set manual)

```typescript
get machineNumber(): number {
  // Kiểm tra xem machineNumber có được set manual không
  if (this.templateOptions['machineNumber']) {
    return this.templateOptions['machineNumber'];
  }
  
  // Lấy index từ field key (nên là array index)
  const field = (this as any).field;
  if (field && field.key !== null && field.key !== undefined) {
    const keyAsNumber = parseInt(field.key.toString(), 10);
    if (!isNaN(keyAsNumber)) {
      return keyAsNumber + 1; // 1-based numbering
    }
  }
  
  // Lấy position từ parent fieldGroup
  if (field && field.parent && field.parent.fieldGroup) {
    const index = field.parent.fieldGroup.indexOf(field);
    if (index >= 0) {
      return index + 1;
    }
  }
  
  // Fallback
  return 1;
}
```

### 2. Cải thiện FormlyRepeatType
Đã đảm bảo các properties được truyền đúng từ template options:

```typescript
<app-repeat-section
  [items]="field.fieldGroup || []"
  [addText]="to.addText"
  [canAdd]="to.canAdd !== false"
  [max]="to.max || Infinity"
  (add)="add()"
  (remove)="remove($event)">
```

## Cách test

1. **Test cơ bản:**
   - Tạo form với repeat field
   - Add thêm machine mới
   - Kiểm tra header của mỗi card có hiển thị đúng "Machine - 1", "Machine - 2", etc.

2. **Test edge cases:**
   - Remove machine ở giữa, kiểm tra numbering có update không
   - Add nhiều machine, kiểm tra numbering có liên tục không
   - Collapse/expand cards

## Files đã thay đổi

1. `/formly-custom/wrappers/formly-card-wrapper.ts` - Core fix cho machine numbering
2. `/formly-custom/types/formly-repeat.type.ts` - Cải thiện property binding

## Kết quả mong đợi

Sau khi áp dụng fix:
- Machine 1: Header hiển thị "Machine - 1"
- Machine 2: Header hiển thị "Machine - 2"  
- Machine 3: Header hiển thị "Machine - 3"
- Etc.

Mỗi machine sẽ có field riêng biệt, không bị gộp chung như trước.

## Lưu ý

- Fix sử dụng getter để tự động update machine number mỗi lần render
- Tương thích với cả manual numbering và auto-detection
- Không breaking change cho existing code