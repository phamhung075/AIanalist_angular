import { AppMaterialModule } from './../../../modules/material/app-material.module';
import { ToastrService } from 'ngx-toastr';
// task.component.ts
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, Input, ViewEncapsulation, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QuillViewComponent, QuillViewHTMLComponent } from 'ngx-quill';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { Tache } from './../../../models/Tache';
import { TacheService } from './../../../services/tache/tache.service';

@Component({
  selector: 'app-task-display',
  templateUrl: './task-display.component.html',
  styleUrls: ['./task-display.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AppMaterialModule,
    QuillViewComponent,
    QuillViewHTMLComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDisplayComponent {
  @Input() _isEdit?:boolean = false;
  @Input() _testView?:boolean = false;
  tachesDisplay$M = model<Partial<Tache>[] | undefined>([]);

  constructor(
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private tacheService: TacheService,
    private toastrService: ToastrService,
  ) { }

  async deleteTask(task: Partial<Tache>, index: any): Promise<void> {
    try {
      const newTache = await this.tacheService.setActive(task.objectId!, false);

      if (newTache != null) {
        this.toastrService.success('Tâche suprrimée avec succès');

      } else {
        this.toastrService.error('Erreur lors de la supression de la tâche');
      }
    } catch (error) {
      this.toastrService.error('Erreur lors de la supression de la tâche');
    }
    this.tachesDisplay$M.set(this.tachesDisplay$M()?.filter((_, i) => i !== index));
  }


  async openEditDialog(task: Partial<Tache>, index: any): Promise<void> {
    const data= {
      objectId: task.objectId,
      titre: task.titre,
      description: task.description,
      tempsLimite: task.tempsLimite,
      realise: task.realise,
      active: task.active ?? true,
      academieAudite_objectId : task.academieAudite?.objectId,
      isEditMode: true,
      _testView: this._testView
    };
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '400px',
      height: '600px',
      data: data,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        //console.log("data to update",result);
        try {
          const newTache = await this.tacheService.update(result);
          //console.log("data after update", newTache);

          if (newTache != null) {
            this.toastrService.success('Tâche modifiée avec succès');
            this.tachesDisplay$M.set([...this.tachesDisplay$M()!.slice(0, index), result, ...this.tachesDisplay$M()!.slice(index + 1)]);

          } else {
            this.toastrService.error('Erreur lors de la création de la tâche');
          }
        } catch (error) {
          this.toastrService.error('Erreur lors de la création de la tâche');
        }
      }
    });
  }


  // Optional: Modify task
  modifyTask(taskId: string, updatedTask: Partial<Partial<Tache>[] | undefined>) {
    this.tachesDisplay$M.update((tasks: Partial<Tache>[] | undefined) =>
      tasks?.map(task => task.objectId === taskId ? { ...task, ...updatedTask } : task)
    );
  }




  sanitizeContent(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

}
