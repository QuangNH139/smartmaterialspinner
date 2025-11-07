import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'app-machine-config',
  template: `
    <div class="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <p-card class="mb-6">
        <ng-template pTemplate="header">
          <div class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Machine Configuration</h1>
            <p class="text-gray-600">Configure your machines with individual cards for better organization</p>
          </div>
        </ng-template>
        
        <form [formGroup]="form" (ngSubmit)="submit()">
          <formly-form 
            [form]="form" 
            [fields]="fields" 
            [options]="options">
          </formly-form>
          
          <ng-template pTemplate="footer">
            <div class="flex justify-end space-x-4">
              <button 
                type="button" 
                pButton
                label="Reset"
                class="p-button-outlined"
                (click)="reset()">
              </button>
              <button 
                type="submit" 
                pButton
                label="Save Configuration"
                class="p-button-success"
                [disabled]="!form.valid">
              </button>
            </div>
          </ng-template>
        </form>
      </p-card>
      
      <p-card>
        <ng-template pTemplate="header">
          <div class="p-4">
            <h2 class="text-lg font-semibold text-gray-900">Configuration Data</h2>
          </div>
        </ng-template>
        
        <pre class="bg-gray-100 p-4 rounded-md text-sm overflow-auto">{{ model | json }}</pre>
      </p-card>
    </div>
  `,
  standalone: false
})
export class MachineConfigComponent {
  form = new FormGroup({});
  model: any = {
    machines: [
      {
        name: 'Machine 1',
        type: 'CNC',
        speed: 1500,
        material: 'steel'
      }
    ]
  };
  options: FormlyFormOptions = {};

  fields: FormlyFieldConfig[] = [
    {
      key: 'machines',
      type: 'repeat',
      templateOptions: {
        addText: 'Add New Machine',
        canAdd: true,
        max: 10
      },
      fieldArray: {
        wrappers: ['card'],
        templateOptions: {
          cardTitle: 'Machine Configuration',
          showRemoveButton: true,
          removable: true,
          collapsible: true,
          collapsed: false
        },
        fieldGroup: [
          {
            key: 'name',
            type: 'input',
            templateOptions: {
              label: 'Machine Name',
              placeholder: 'Enter machine name',
              required: true,
            },
            className: 'mb-4'
          },
          {
            key: 'type',
            type: 'select',
            templateOptions: {
              label: 'Machine Type',
              placeholder: 'Select machine type',
              required: true,
              options: [
                { value: 'CNC', label: 'CNC Machine' },
                { value: 'LATHE', label: 'Lathe Machine' },
                { value: 'MILL', label: 'Milling Machine' },
                { value: 'DRILL', label: 'Drill Press' },
                { value: 'GRINDER', label: 'Grinder' }
              ]
            },
            className: 'mb-4'
          },
          {
            key: 'speed',
            type: 'input',
            templateOptions: {
              type: 'number',
              label: 'Operating Speed (RPM)',
              placeholder: 'Enter speed in RPM',
              min: 1,
              max: 10000,
              required: true,
            },
            className: 'mb-4'
          },
          {
            key: 'material',
            type: 'autocomplete',
            templateOptions: {
              label: 'Primary Material',
              placeholder: 'Search for material',
              required: true,
              options: [
                { value: 'steel', label: 'Steel' },
                { value: 'aluminum', label: 'Aluminum' },
                { value: 'brass', label: 'Brass' },
                { value: 'copper', label: 'Copper' },
                { value: 'titanium', label: 'Titanium' },
                { value: 'plastic', label: 'Plastic' },
                { value: 'wood', label: 'Wood' }
              ]
            },
            className: 'mb-4'
          },
          {
            key: 'settings',
            type: 'group',
            templateOptions: {
              label: 'Advanced Settings'
            },
            fieldGroup: [
              {
                key: 'coolant',
                type: 'select',
                templateOptions: {
                  label: 'Coolant Type',
                  placeholder: 'Select coolant',
                  options: [
                    { value: 'water', label: 'Water-based' },
                    { value: 'oil', label: 'Oil-based' },
                    { value: 'synthetic', label: 'Synthetic' },
                    { value: 'none', label: 'None' }
                  ]
                },
                className: 'mb-4'
              },
              {
                key: 'tolerance',
                type: 'input',
                templateOptions: {
                  type: 'number',
                  label: 'Tolerance (±mm)',
                  placeholder: 'Enter tolerance',
                  min: 0.001,
                  max: 1,
                  step: 0.001
                },
                className: 'mb-4'
              }
            ]
          }
        ]
      }
    }
  ];

  submit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.model);
      alert('Configuration saved successfully!');
    }
  }

  reset() {
    this.model = {
      machines: [
        {
          name: 'Machine 1',
          type: 'CNC',
          speed: 1500,
          material: 'steel'
        }
      ]
    };
    this.form.reset();
  }
}