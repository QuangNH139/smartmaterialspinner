import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormsModule } from '@angular/forms';

import { AutocompleteFieldComponent } from './autocomplete-field';

describe('AutocompleteField', () => {
  let component: AutocompleteFieldComponent;
  let fixture: ComponentFixture<AutocompleteFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AutocompleteFieldComponent],
      imports: [AutoCompleteModule, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutocompleteFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
