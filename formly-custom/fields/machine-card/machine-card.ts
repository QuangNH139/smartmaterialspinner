import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';

@Component({
  selector: 'app-machine-card',
  templateUrl: './machine-card.html',
  styleUrls: ['./machine-card.scss'],
  standalone: false,
})
export class MachineCardComponent {
  @Input() title = '';
  @Input() machineNumber = 1;
  @Input() showRemoveButton = true;
  @Input() removable = true;
  @Input() collapsible = true;
  @Input() collapsed = false;

  @Output() remove = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<boolean>();

  @ContentChild('cardContent', { static: false }) cardContent!: TemplateRef<any>;

  onToggle() {
    this.collapsed = !this.collapsed;
    this.toggle.emit(this.collapsed);
  }

  onRemove() {
    if (this.removable) {
      this.remove.emit();
    }
  }
}