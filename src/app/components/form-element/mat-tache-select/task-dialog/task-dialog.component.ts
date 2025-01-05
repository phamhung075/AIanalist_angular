import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, ViewEncapsulation, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { AppMaterialModule } from '../../../modules/material/app-material.module';
import { TacheService } from '../../../services/tache/tache.service';

@Component({
  selector: 'app-task-dialog',
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.scss'],
  imports: [
    CommonModule,
    AppMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillEditorComponent
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDialogComponent {
  taskForm: FormGroup;
  isEditMode = false;
  _testView$S = signal<boolean>(false);
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TaskDialogComponent>,
    private tacheService: TacheService,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      titre: new FormControl('', Validators.required),
      description: new FormControl(''),
      tempsLimite: new FormControl('', Validators.required),
      realise: new FormControl(false, Validators.required),
      academieAudite: new FormControl(null, Validators.required),
      active: new FormControl(true, Validators.required),
      objectId: new FormControl(null)
    });

    if(data){
      //console.log(data);
      this.setTestView(this.data._testView ?? false);

      const academieAuditePointer = this._parseToPointerByObjId(data.academieAudite_objectId, 'AcademieAudite');
      this.isEditMode = data.isEditMode ?? false;
      if (this.isEditMode === false)
        this.taskForm.patchValue({
          titre: data.titre,
          description: data.description,
          tempsLimite: data.tempsLimite,
          realise: data.realise ? true : false,
          academieAudite: academieAuditePointer,
          active: data.active ?? true,
        }, { emitEvent: true });
      else
        this.taskForm.patchValue({
          objectId: data.objectId,
          titre: data.titre,
          description: data.description,
          tempsLimite: data.tempsLimite,
          realise: data.realise ? true : false,
          academieAudite: academieAuditePointer,
          active: data.active ?? true,
        }, { emitEvent: true });

    }
  }

  _parseToPointerByObjId(objectId: string, className: string = ''): any {
    if (className === '') {
      console.error('className is required on _parseToPointerByObjId method.');
      return null;
    }
    if (!objectId) {
      return null;
    }
    return {
      __type: 'Pointer',
      className: className,
      objectId: objectId,
    };
  }

  setTestView(value: boolean) {
    this._testView$S.set(value);
    this.changeDetectorRef.markForCheck();
  }

  onSubmit() {
    if (this.taskForm.valid) {
      // Convert 'realise' value to boolean
      const formValue = { ...this.taskForm.value, realise: this.taskForm.value.realise === 'true' };
      this.dialogRef.close(formValue);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
}
