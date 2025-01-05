import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewEncapsulation, computed, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FieldAutocompleteAcademieAuditeComponent } from '../../autocomplet/academie-audite/field-autocomplete-academie-audite.component';
import { MatFileSelectComponent } from '../../mat-file-select/mat-file-select.component';
import { GenericMatInputComponent } from '../../mat-form-field/mat-form-field.generic';
import { GenericMatSelectComponent } from '../../mat-select/mat-select.generic';

@Component({
  selector: 'app-enquete-review',
  templateUrl: './enquete-review-component.component.html',
  styleUrl: './enquete-review-component.component.scss',
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
    GenericMatSelectComponent,
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnqueteReviewComponent implements OnInit{
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

  deleteQuestion(index: number) {
  const questions = this.questions$S();

    questions.splice(index, 1);
    this.questions$M.set(JSON.stringify(questions));
  }

  moveQuestionUp(index: number) {
    const questions = this.questions$S();

    if (index > 0) {
      [questions[index - 1], questions[index]] = [questions[index], questions[index - 1]];
      this.questions$M.set(JSON.stringify(questions));
    }
  }

  moveQuestionDown(index: number) {
    const questions = this.questions$S();

    if (index < questions.length - 1) {
      [questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
      this.questions$M.set(JSON.stringify(questions));
    }
  }

  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + 'k';
    }

    return `${value}`;
  }
}
