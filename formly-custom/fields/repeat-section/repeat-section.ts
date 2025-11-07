import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-repeat-section',
  templateUrl: './repeat-section.html',
  styleUrl: './repeat-section.scss',
  standalone: false,
})
export class RepeatSectionComponent {
  @Input() items: any[] = [];
  @Input() addText = 'Add';
  @Input() canAdd = true;
  @Input() max = Infinity;

  @Output() add = new EventEmitter<void>();
  @Output() remove = new EventEmitter<number>();
}
