import { Question } from './../../../models/EnqueteRecueil';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';



@Component({
  selector: 'app-enquete-generator',
  templateUrl: './enquete-generator-component.component.html',
  styleUrl: './enquete-generator-component.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    FormsModule,
  ],
  standalone: true,
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    // { provide: MdDialogRef, useValue: {} }, --> deprecated
    { provide: MatDialogRef, useValue: {} },
  ],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnqueteGeneratorComponentComponent {
  constructor(


  ) {

  }

  currentQuestion: Question = { type: 'short-answer', question: '' };
  questions: Question[] = [];
  questions$M = model<string>();
  addOption(option: string) {
    if(option.trim().length === 0) {
      return;
    }
    if (!this.currentQuestion.options) {
      this.currentQuestion.options = [];
    }
    this.currentQuestion.options.push(option);
  }

  addQuestion() {
    const questionsFromModel = this.questions$M();
    this.questions = questionsFromModel ? JSON.parse(questionsFromModel) : [];
    this.questions.push({ ...this.currentQuestion });
    this.currentQuestion = { type: 'short-answer', question: '' };
    this.questions$M.set(JSON.stringify(this.questions));
  }

  addRow(row: string) {
    if (!this.currentQuestion.rows) {
      this.currentQuestion.rows = [];
    }
    this.currentQuestion.rows.push(row);
  }

  addColumn(column: string) {
    if (!this.currentQuestion.columns) {
      this.currentQuestion.columns = [];
    }
    this.currentQuestion.columns.push(column);
  }

}
