import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineCardComponent } from './machine-card';

describe('MachineCardComponent', () => {
  let component: MachineCardComponent;
  let fixture: ComponentFixture<MachineCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MachineCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit remove event when onRemove is called', () => {
    spyOn(component.remove, 'emit');
    component.removable = true;
    component.onRemove();
    expect(component.remove.emit).toHaveBeenCalled();
  });

  it('should toggle collapsed state when onToggle is called', () => {
    const initialState = component.collapsed;
    spyOn(component.toggle, 'emit');
    
    component.onToggle();
    
    expect(component.collapsed).toBe(!initialState);
    expect(component.toggle.emit).toHaveBeenCalledWith(component.collapsed);
  });

  it('should not emit remove event when not removable', () => {
    spyOn(component.remove, 'emit');
    component.removable = false;
    component.onRemove();
    expect(component.remove.emit).not.toHaveBeenCalled();
  });
});