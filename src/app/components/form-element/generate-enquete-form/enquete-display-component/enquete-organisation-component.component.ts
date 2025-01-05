import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation, computed, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { ENQUETE_RECUEIL__FORM_BASE_CONFIG, EnqueteRecueil_FormBase } from '../../../modals/create-enquete-recueil-modal/create-enquete-recueil-modal.component';
import { FieldAutocompleteAcademieAuditeComponent } from './../../../form-element/autocomplet/academie-audite/field-autocomplete-academie-audite.component';
import { MatFileSelectComponent } from './../../../form-element/mat-file-select/mat-file-select.component';
import { GenericMatInputComponent } from './../../../form-element/mat-form-field/mat-form-field.generic';
import { GenericMatSelectComponent } from './../../../form-element/mat-select/mat-select.generic';

@Component({
  selector: 'app-enquete-organisation',
  templateUrl: './enquete-organisation-component.component.html',
  styleUrl: './enquete-organisation-component.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatSliderModule,
    MatIconModule,
    MatButtonModule,
    GenericMatInputComponent,
    MatFileSelectComponent,
    FieldAutocompleteAcademieAuditeComponent,
    GenericMatSelectComponent
  ],
  standalone: true,
  providers: [
    {
      provide: ENQUETE_RECUEIL__FORM_BASE_CONFIG,
      useClass: EnqueteRecueil_FormBase,
    },
  ],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnqueteOrganisationComponent implements OnInit{
  questions$M = model<string>();
  questions$S = computed(() => {
    if (this.questions$M() === undefined) {
      return [];
    }
    return JSON.parse(this.questions$M()!); }
    );
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any // Ensure data is public

  ) {



  }

  async ngOnInit(): Promise<void> {
    this.changeDetectorRef.detectChanges();
    //console.log('Received data in dialog:', this.data); // Debugging log to verify received data format
    if (this.data && this.data.questions) {
      this.questions$M.set(this.data.questions); // Set the data directly without re-stringifying
      this.changeDetectorRef.detectChanges();
    }
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }
}
