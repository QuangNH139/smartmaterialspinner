# Quick Start Guide - SignalR Hub Integration

## Hướng dẫn sử dụng nhanh (Vietnamese)

Đây là ví dụ về cách lắng nghe thay đổi của `lineProduces` và `selectedLineProduce` khi có thay đổi từ server thông qua SignalR.

### Yêu cầu đã thực hiện:

1. ✅ **Create connection** - Tạo kết nối đến `hub/downtime`
2. ✅ **Join Group** - Đăng ký nhóm với các tham số `LineCd`, `ProcessCd`, `DivisionCd` thông qua method `JoinGroup`
3. ✅ **Listen server** - Lắng nghe sự kiện `lineProduceChange` từ server

### Cấu trúc thư mục

```
store/
├── models/
│   └── line-produce.model.ts      # Model cho LineProduce
├── global.reducer.ts               # Reducer quản lý state (dòng 72 xử lý thay đổi)
├── global.actions.ts               # Các actions
├── downtime-hub.service.ts        # Service kết nối SignalR
├── downtime-monitor.component.ts  # Component ví dụ
├── global-store.module.ts         # Module
└── README.md                       # Tài liệu chi tiết
```

### Cách sử dụng trong Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DowntimeHubService } from './store/downtime-hub.service';
import { LineProduce } from './store/models/line-produce.model';
import { selectLineProduces, selectSelectedLineProduce } from './store/global.reducer';

@Component({
  selector: 'app-my-component',
  template: `
    <div>
      <h2>Line Produces</h2>
      <div *ngFor="let lp of lineProduces$ | async">
        {{ lp.lineCd }} - {{ lp.lineName }}
      </div>
      
      <h2>Selected Line Produce</h2>
      <div *ngIf="selectedLineProduce$ | async as selected">
        {{ selected.lineCd }} - {{ selected.lineName }}
      </div>
    </div>
  `
})
export class MyComponent implements OnInit, OnDestroy {
  // Observables để lắng nghe thay đổi
  lineProduces$: Observable<LineProduce[]>;
  selectedLineProduce$: Observable<LineProduce | null>;
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private downtimeHubService: DowntimeHubService
  ) {
    // Khởi tạo observables
    this.lineProduces$ = this.store.select(selectLineProduces);
    this.selectedLineProduce$ = this.store.select(selectSelectedLineProduce);
  }

  ngOnInit(): void {
    // Bước 1: Tạo kết nối đến hub/downtime
    this.downtimeHubService.createConnection();
    
    // Bước 2: Đăng ký nhóm với LineCd, ProcessCd, DivisionCd
    this.downtimeHubService.joinGroup('LINE001', 'PROC001', 'DIV001');
    
    // Bước 3: Lắng nghe thay đổi (tự động xử lý bởi service)
    // Đăng ký theo dõi thay đổi của lineProduces
    this.lineProduces$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lineProduces => {
        console.log('lineProduces đã thay đổi:', lineProduces);
        // Xử lý khi lineProduces thay đổi
      });
    
    // Đăng ký theo dõi thay đổi của selectedLineProduce
    this.selectedLineProduce$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        console.log('selectedLineProduce đã thay đổi:', selected);
        // Xử lý khi selectedLineProduce thay đổi
      });
  }

  ngOnDestroy(): void {
    // Cleanup
    this.destroy$.next();
    this.destroy$.complete();
    
    // Ngắt kết nối SignalR
    this.downtimeHubService.stopConnection();
  }
}
```

### Luồng xử lý Real-time

1. **Server gửi sự kiện**: Server gửi event `lineProduceChange` với dữ liệu LineProduce đã cập nhật
2. **Hub Service nhận**: `DowntimeHubService` nhận event trong method `setupListeners()`
3. **Dispatch Action**: Service dispatch action `lineProduceChanged` vào store
4. **Reducer xử lý**: `global.reducer.ts` xử lý action và cập nhật state (dòng 72)
5. **Component cập nhật**: Các component đã subscribe `lineProduces$` hoặc `selectedLineProduce$` nhận được update

### Điểm quan trọng - Dòng 72 trong global.reducer.ts

Đây là nơi xử lý cập nhật real-time từ SignalR:

```typescript
// Handle real-time update from SignalR
on(lineProduceChanged, (state, { lineProduce }) => {
  const updatedLineProduces = state.lineProduces.map(lp => 
    lp.lineCd === lineProduce.lineCd ? lineProduce : lp
  );
  
  // Nếu line produce không tồn tại, thêm mới
  const exists = state.lineProduces.some(lp => lp.lineCd === lineProduce.lineCd);
  if (!exists) {
    updatedLineProduces.push(lineProduce);
  }
  
  // Cập nhật selectedLineProduce nếu khớp (dòng 72-76)
  const updatedSelectedLineProduce = state.selectedLineProduce?.lineCd === lineProduce.lineCd 
    ? lineProduce 
    : state.selectedLineProduce;
  
  return {
    ...state,
    lineProduces: updatedLineProduces,
    selectedLineProduce: updatedSelectedLineProduce
  };
})
```

### Cài đặt Dependencies

```bash
npm install @ngrx/store @microsoft/signalr
```

### Import Module vào App

```typescript
import { GlobalStoreModule } from './store/global-store.module';

@NgModule({
  imports: [
    GlobalStoreModule,
    // ... các module khác
  ]
})
export class AppModule { }
```

### Kiểm tra kết nối

Service tự động kết nối lại nếu mất kết nối và có các method để kiểm tra:

```typescript
// Kiểm tra trạng thái kết nối
const isConnected = this.downtimeHubService.isConnected();

// Lấy trạng thái kết nối chi tiết
const state = this.downtimeHubService.getConnectionState();
```

### Ví dụ Component hoàn chỉnh

Xem file `downtime-monitor.component.ts` để biết ví dụ component đầy đủ với:
- Hiển thị trạng thái kết nối
- Form để join/leave group
- Hiển thị danh sách lineProduces
- Hiển thị selectedLineProduce
- Tự động cập nhật khi có thay đổi từ server

---

## English Quick Guide

This is an example of how to listen for changes to `lineProduces` and `selectedLineProduce` when changes occur from the server via SignalR.

### Requirements Implemented:

1. ✅ **Create connection** - Connect to `hub/downtime`
2. ✅ **Join Group** - Subscribe to group with `LineCd`, `ProcessCd`, `DivisionCd` parameters via `JoinGroup` method
3. ✅ **Listen server** - Listen for `lineProduceChange` events from server

### Key Files:

- **global.reducer.ts** (line 72): Handles real-time updates from SignalR
- **downtime-hub.service.ts**: SignalR connection and group management
- **downtime-monitor.component.ts**: Complete example component

See `README.md` for detailed English documentation.
