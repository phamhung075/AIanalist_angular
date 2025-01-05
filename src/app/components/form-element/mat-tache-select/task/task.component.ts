import { IFormGroupFieldItem } from './../../../models/_generic/form-group-field-item.interface';
import { AppMaterialModule } from './../../../modules/material/app-material.module';
import { ParseUtilsAbstract } from './../../../services/parse-utils/parse-utils.abstract';
// task.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, ViewEncapsulation, computed, effect, inject, model, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuillEditorComponent } from 'ngx-quill';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { Tache } from 'src/lib/models/Tache';
import { EditStateService } from '../../edit-state/edit-state.service';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { TaskDisplayComponent } from '../task-display/task-display.component';
import { AuthService } from '../../../services/_core/auth/auth-guard.service';
import { ParseUtilsService } from '../../../services/parse-utils/parse-utils.service';
import { DocumentService } from '../../../services/document/document.service';
import { TacheService } from '../../../services/tache/tache.service';
import { AcademieAuditeService } from '../../../services/academie-audite/academie-audite.service';
import { Contact } from '../../../models/Contact';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AppMaterialModule,
    TaskDisplayComponent,
    QuillEditorComponent
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComponent extends ParseUtilsAbstract implements OnChanges, OnInit, OnChanges, OnDestroy {

  @Input() formGroup?: FormGroup;
  @Input() controlName?: string;
  @Input() label!: string;
  @Input() allowedTypes: string[] = [];
  @Input() _isEdit?: boolean = false;
  @Input() _testView?: boolean = false;
  @Input() controlValue?: any;
  @Input() academieAudite_objectId?: string;
  field!: IFormGroupFieldItem;

  // Access the tache input with ViewChild
  @ViewChild('tacheInput') tacheInput!: ElementRef;
  selectedFileIdentifiers: Set<string> = new Set();
  formGroupInit?: FormGroup;

  control?: FormControl;
  @Input() piecesJointes?: Partial<Document>[];

  isRestored$M = model(false);
  isAnnuled$M = model(false);
  isExplanded$S = signal<boolean>(false);
  tachesLenght$S = computed(() => Array(this.tachesDisplay$M()).length);
  needReLoadFile$M = model(false);
  isEdit$S = signal(false);
  private destroyRef = inject(DestroyRef);
  currentEditTaches$M = model<Partial<Tache>[] | undefined>([]);
  tachesDisplay$M = model<Partial<Tache>[] | undefined>(undefined);

  protected destroy$ = new Subject<void>();

  tachesInput$S = toSignal(
    toObservable(this.currentEditTaches$M)
      .pipe(switchMap(async (taches) => {
        if (taches) {
          return await this.formalizer(taches);
        }
        return [];
      })))
  safeDocxUrl?: SafeResourceUrl;


  isAnnuledSubscription$: Subscription = new Subscription();
  tacheAdd: string[] = []
  tacheDelete: string[] = []
  tacheCreator?: Partial<Contact>;


  newTask$S = signal<Tache>({
    titre: '',
    description: '',
    tempsLimite: new(Date),
    realise : false,
  } as Tache);

  taskForm: FormGroup;

  constructor(
    private editStateSrv: EditStateService,
    private toastrService: ToastrService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private parseSrv: ParseUtilsService,
    private documentService: DocumentService,
    private tacheService: TacheService,
    private academieAuditeService: AcademieAuditeService,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    changeDetectorRef: ChangeDetectorRef
  ) {
    super(changeDetectorRef);
    this.authService.getUser
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.tacheCreator = user;
      });

    effect(() => {
      //console.log("-",this._isEdit);
      //console.log("tachesLenght$S", this.tachesLenght$S());
      //console.log("taches$S", this.tachesInput$S());
      //console.log("currentEditTaches$M", this.currentEditTaches$M());
    });

    this.isAnnuledSubscription$ = toObservable(this.isAnnuled$M).subscribe(async (isAnnuled) => {
      if (isAnnuled) {
        const isRestored = await this.restoreAndCleanTaches();
        //console.log("isRestored", isRestored);
        if (isRestored) {
          this.isRestored$M.set(true);
        } else {
          this.toastrService.error('Erreur lors de la restauration des fichiers');
        }
      }
    });

    this.taskForm = new FormGroup({
      titre: new FormControl('Titre'),
      description: new FormControl('Description'),
      tempsLimite: new FormControl(new (Date)),
      realise: new FormControl(false),
    });
  }

  ngOnInit(): void {

    if (this.formGroup && this.controlName) {

      this.control = this.formGroup?.get(this.controlName!) as FormControl;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["_isEdit"])
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.isAnnuledSubscription$.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  async openDialog(): Promise<void> {
    const data = {
      academieAudite_objectId: this.academieAudite_objectId,
      _testView: this._testView,
    };

    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '400px',
      height: '600px',
      data: data,
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        //console.log(result);
        try {
          const newTache = await this.tacheService.create(result);
          if (newTache != null) {
            this.addTask(newTache as Partial<Tache>);
          } else {
            this.toastrService.error('Erreur lors de la création de la tâche');
          }
        } catch (error) {
          this.toastrService.error('Erreur lors de la création de la tâche');
        }
      }
    });
  }


  addTask(task: Partial<Tache>) {
    //console.log("task created", task);
    this.tachesDisplay$M.update((tasks: Partial<Tache>[] | undefined) => [...tasks!, task]);
    // const newTachePointer = this._parseToPointerByObjId(task.objectId!, "Tache");
    // this.currentEditTaches$M.update((tasks: Partial<Tache>[] | undefined) => [...tasks!, newTachePointer]);
    // this.changeDetectorRef.detectChanges();
  }

  onSubmit() {
    const newTask: Tache = this.control?.value;
    this.tachesDisplay$M.update((tasks: Partial<Tache>[] | undefined) => [...tasks!, newTask]);
    this.control?.reset();
  }

  deleteTask(taskId: string) {
    this.tachesDisplay$M.update((tasks: Partial<Tache>[] | undefined) => tasks?.filter(task => task.objectId !== taskId));
  }



  getTasks() {
    return this.currentEditTaches$M();
  }


  async formalizer(taches: Partial<Tache>[] | undefined): Promise<Tache[]> {
    const elements = taches;
    //console.log('formalizer with elements', elements);

    const array: Array<any> = [];
    if (elements) {
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        if (!element || !element['objectId']) {
          console.error('Element objectId not found on formalizer mat-tache-select');
          continue; // Skip to the next iteration
        }
        const tache = await this.getTacheValue(element) as Partial<Tache>;
        if (!tache) {
          console.error('Tache not found or deleted');
          this.removeTacheFromTaches(index); // Updated here
          continue; // Skip to the next iteration
        }
        //console.log('formalizer with tache', tache);
        array.push({
          ...tache,
        });
      }
    }
    //console.log('formalizer with array', array);
    this.tachesDisplay$M.set(array as Tache[]);

    return array as Tache[];
  }

  private removeTacheFromTaches(index: number): void {
    const taches = this.formGroup?.get('taches')?.value;
    if (taches) {
      if (index >= 0 && index < taches.length) {
        taches.splice(index, 1); // Remove item at the specified index
      } else {
        console.error(`Index ${index} is out of bounds for taches array`);
      }
      this.formGroup?.get('taches')?.setValue(taches);
    } else {
      console.error('Array taches not found in form group');
    }
  }
  async restoreAndCleanTaches(): Promise<boolean> {
    const allRestored = await this.restoreDeletedTaches();
    //console.log('allRestored:', allRestored);

    return allRestored;
  }

  async getTacheValue(tache: Partial<Tache> | undefined) {
    this._handleObjectId(tache);
    if (tache!.objectId && tache) {
      tache = await this.tacheService.read(tache.objectId!) as Tache;
      if (tache) {
        this.changeDetectorRef.markForCheck();

        this._handleObjectId(tache);
      }
      else {
        console.error('Tache not found on getTachesValue mat-tache-select');
        tache = undefined;
      }
    } else {
      tache = undefined;
    }
    return tache;
  }

  async restoreDeletedTaches(): Promise<boolean> {
    const taches = this.currentEditTaches$M();
    const elements = taches;
    //console.log('formalizer with elements', elements);
    let allRestored = false;

    const array: Array<any> = [];
    if (elements) {
      for (let index = 0; index < elements.length; index++) {
        const element = elements[index];
        if (!element || !element['objectId']) {
          console.error('Element objectId not found on formalizer mat-tache-select');
          continue; // Skip to the next iteration
        }
        const tache = await this.getTacheValue(element) as Partial<Tache>;
        if (!tache) {
          console.error('Tache not found or deleted');
          this.removeTacheFromTaches(index); // Updated here
          continue; // Skip to the next iteration
        }
        //console.log('formalizer with tache', tache);
        array.push({
          ...tache,
        });
      }
      allRestored = true;
    }
    //console.log('formalizer with array', array);
    this.tachesDisplay$M.set(array as Tache[]);


    if (allRestored) {
      // this.toastrService.info('Backup files restored successfully.');
    } else {
      this.toastrService.warning('Backup files restoration completed with some errors.');
    }

    return allRestored;
  }

  // public _parseToPointerByObjId(objectId: string, className: string = ''): any {
  //   return {
  //     __type: 'Pointer',
  //     className: className,
  //     objectId: objectId,
  //   };
  // }
}
