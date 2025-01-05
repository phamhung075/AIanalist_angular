import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'lib-form-field-header',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './form-field-header.component.html',
  styleUrl: './form-field-header.component.scss'
})
export class FormFieldHeaderComponent {
  @Input() mainContactLabel: string = '';
  @Input() maintContantHint: string = '';
}
