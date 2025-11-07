import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepeatSectionComponent } from './repeat-section';

describe('RepeatSection', () => {
  let component: RepeatSectionComponent;
  let fixture: ComponentFixture<RepeatSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepeatSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepeatSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
