import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { AutocompleteFieldComponent } from './fields/autocomplete-field/autocomplete-field';
import { SelectFieldComponent } from './fields/select-field/select-field';
import { RepeatSectionComponent } from './fields/repeat-section/repeat-section';
import { MachineCardComponent } from './fields/machine-card/machine-card';

import { FormlyFieldAutoComplete } from './types/formly-autocomplete.type';
import { FormlyFieldSelectComponent } from './types/formly-select.type';
import { FormlyRepeatType } from './types/formly-repeat.type';
import { FormlyCardWrapperComponent } from './wrappers/formly-card-wrapper';

@NgModule({
  declarations: [
    AutocompleteFieldComponent,
    SelectFieldComponent,
    RepeatSectionComponent,
    MachineCardComponent,
    FormlyFieldAutoComplete,
    FormlyFieldSelectComponent,
    FormlyRepeatType,
    FormlyCardWrapperComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AutoCompleteModule,
    SelectModule,
    ButtonModule,
    CardModule,
    FormlyPrimeNGModule,
    FormlyModule.forRoot({
      types: [
        {
          name: 'autocomplete',
          component: FormlyFieldAutoComplete,
          wrappers: ['form-field'],
        },
        {
          name: 'select',
          component: FormlyFieldSelectComponent,
          wrappers: ['form-field'],
        },
        { name: 'repeat', component: FormlyRepeatType },
      ],
      wrappers: [
        {
          name: 'card',
          component: FormlyCardWrapperComponent,
        },
      ],
    }),
  ],
  exports: [FormlyModule, FormlyPrimeNGModule, MachineCardComponent],
})
export class FormlyCustomModule {}
