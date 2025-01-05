import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewEncapsulation, WritableSignal, computed, signal } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AcademieAudite } from '../../models/AcademieAudite';
import { AcademieAuditeService } from '../../services/academie-audite/academie-audite.service';
import { AppMaterialModule } from '../../modules/material/app-material.module';
import { AuthService } from '../../services/_core/auth/auth-guard.service';
import { CONTACT__FORM_BASE_CONFIG } from '../../modals/create-contact-modal/create-contact-modal.component';
import { Contact } from '../../models/Contact';
import { ContactService } from '../../services/contact/contact.service';
import { Contact_FormBase } from '../../modals/create-contact-modal/create-contact-modal.component';
import { EntrepriseService } from '../../services/entreprise/entreprise.service';
import { EnumCategorieContact } from '../../enums/EnumContact';
import { EnumCategorieContactModifiable } from '../../enums/EnumContact';
import { FieldAutocompleteAcademieAuditeComponent } from '../../form-element/autocomplet/academie-audite/field-autocomplete-academie-audite.component';
import { FieldAutocompleteEntrepriseComponent } from '../../form-element/autocomplet/entreprise/field-autocomplete-entreprise.component';
import { GenericMatInputComponent } from '../../form-element/mat-form-field/mat-form-field.generic';
import { GenericMatSelectComponent } from '../../form-element/mat-select/mat-select.generic';
import { IFormBase } from '../../models/interface/_generic/form-base.interface';
import { IOption } from "../../models/_generic/options.interface";
import { ParseUtilsAbstract } from '../../services/parse-utils/parse-utils.abstract';
import { ParseUtilsService } from '../../services/parse-utils/parse-utils.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface AliasClasse extends Contact { }

@Component({
  selector: 'app-my-contact',
  templateUrl: './my-contact.component.html',
  styleUrl: "../../scss/list.page.scss",
  imports: [
    CommonModule,
    AppMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    FieldAutocompleteAcademieAuditeComponent,
    FieldAutocompleteEntrepriseComponent,
    GenericMatInputComponent,
    GenericMatSelectComponent,
    MatProgressSpinnerModule
  ],

  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    // { provide: MdDialogRef, useValue: {} }, --> deprecated
    { provide: MatDialogRef, useValue: {} },
    {
      provide: CONTACT__FORM_BASE_CONFIG,
      useClass: Contact_FormBase,
    },
  ],
  standalone: true,
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyContactComponent extends ParseUtilsAbstract
  implements OnInit, OnDestroy {

  _isEdit = false;

  typeCategorieAcademieList: string[] = [
    'Academie Gérante',
    'Academie Abonnée',
  ];

  form: FormGroup = new FormGroup({});
  formBase: any = {};
  categoriesContactModifiableList_IOption: IOption[] = [];
  _categoriesContactModifiableList: EnumCategorieContactModifiable[] = [];
  _categoriesContactSelectList: EnumCategorieContact[] = [];
  _categoriesContactSelectList_IOption: IOption[] = [];
  formStatus: Subscription = new Subscription();
  _formeJuridiqueSelectList_IOption: IOption[] = [];
  _academieGerantSelectList_IOption: IOption[] = [];
  removeThisIfExistOther = {
    key: EnumCategorieContact.NONDEFINI,
    label: EnumCategorieContact.NONDEFINI,
  } as IOption;
  listGenre = this._convertStringArrayToIOptions([
    'Homme',
    'Femme',
    'Autre',
  ]) as IOption[];

  excepts: string[] = [
    "categorieContact",
    "academieAudite",
    "entreprise",
  ];

  categoriesContact_filterPagninator?: EnumCategorieContact;
  currentEditElement: AliasClasse | null = null;
  onOtherAcademie: boolean = false;

  searchSubscription: Subscription = new Subscription();
  userSubscription!: Subscription;
  valueChangeSubscriptions: Subscription[] = [];
  user: Contact | undefined;
  isLoadingResults = true;

  initialEmailValue = signal<string>("");
  isAnnuled$M = signal<boolean>(false);
  isLoading$S = signal<boolean>(false);

  myAcademieAudite = signal<AcademieAudite | undefined>(undefined);
  myAcademieObjectId = computed(() => {
    return (this.myAcademieAudite() && this.myAcademieAudite()!.objectId) ? this.myAcademieAudite()!.objectId : undefined
  });

  selectAcademieAudite = signal<AcademieAudite | undefined>(undefined);
  selectAcademieAuditeObjectId = computed(() => {
    return (this.selectAcademieAudite() && this.selectAcademieAudite()!.objectId) ? this.selectAcademieAudite()!.objectId : undefined
  });
  profilePicture = signal<string>("/assets/images/no-profile.png");
  constructor(
    changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private contactService: ContactService,
    private academieAuditeService: AcademieAuditeService,
    private entrepriseService: EntrepriseService,
    private toastrService: ToastrService,
    private parseUtilsService: ParseUtilsService,
    @Inject(CONTACT__FORM_BASE_CONFIG) private formBaseConfig: IFormBase,

  ) {
    super(
      changeDetectorRef,
    );
    this.initValues();
  }

  get aliasService() {
    return this.contactService;

  }



  /**
     * Initializes the component.
     * This method is called after the component's data-bound properties have been initialized,
     * and the component's view has been fully initialized.
     * It is used to perform any initialization logic for the component.
     */
  async ngOnInit(): Promise<void> {
    this.isLoading$S.set(true);

    const myAcademieAudite = await this.academieAuditeService.readMyAcademieAudite() as AcademieAudite;
    this.selectAcademieAudite.set(myAcademieAudite);

    this._isEdit = false;
    this.userSubscription = this.authService.getUser.subscribe((user) => {
      this.user = user;
    });
    await this.loadData();

    this._isEdit = false;
    this._viewMode();
    this.isLoadingResults = false;
    this.form.get("categorieContact")?.disable
    this.form.get("academieAudite")?.disable
    this.form.get("entreprise")?.disable
    
    this.changeDetectorRef.detectChanges();
  }



  initValues = async (): Promise<void> => {
    this.form = this.formBaseConfig.form!;
    this.categoriesContactModifiableList_IOption = this.formBaseConfig._categoriesContactSelectList_IOption!;


    // this.form.get('entreprise')?.valueChanges.pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe(value => {
    //   const isValidEntreprise = value && value.hasOwnProperty('denominationSociale') && value.hasOwnProperty('objectId');
    //   this.selectAcademieAuditeObjectId() = this.form.get('academieAudite')?.value.objectId;
    //   if (isValidEntreprise) {
    //     this._disableEditControls(['entreprise'])
    //     //console.log("entreprise disable")
    //   } else {
    //     this._enableEditControls(['entreprise'])
    //     //console.log("entreprise enable")

    //   }
    //   this.changeDetectorRef.markForCheck()
    // });

  }


  _changeProfilePicture($event: any, profilePicture: WritableSignal<string>) {
    this.formBaseConfig._changeProfilePicture!($event, profilePicture);
  }

  async loadData(): Promise<void> {
    this.isLoading$S.set(true);

    // Fetch the pages asynchronously and wait for the result.
    this.currentEditElement = await this.aliasService.readMyContact() as AliasClasse;
    if (this.currentEditElement && this.currentEditElement.email != null) {
      this.initialEmailValue.set(this.currentEditElement.email)
    }
    if (this.currentEditElement.profilePicture?.parseFile?.url) this.profilePicture.set(this.currentEditElement.profilePicture?.parseFile?.url);
    else this.profilePicture.set("/assets/images/no-profile.png");

    // Loop through each result to process them.

    this.formatElementAfterFetchPage(this.currentEditElement);
    this._formGroupGetElementsvalues(this.currentEditElement!, this.form);
    this.isLoading$S.set(false);

  }

  async formatElementAfterFetchPage(element: AliasClasse): Promise<void> {
    this._handleObjectId(element);
    this._formatDateToInput(element, "dateNaissance");
    this._formatDateToInput(element, "dateRencontre");
    this._getElementValue(element, 'academieAudite', this.academieAuditeService);
    this._getElementValue(element, 'entreprise', this.entrepriseService);
    this.changeDetectorRef.detectChanges();
  }


  async loadElementWithDataComplet(element: AliasClasse): Promise<void> {
    this._handleObjectId(element);
    this._formatDateToInput(element, "dateNaissance");
    this._formatDateToInput(element, "dateRencontre");

    this.changeDetectorRef.detectChanges();
  }

  async _getElementValueAndUpdateForm<T extends { objectId?: string }>(
    formGroup: FormGroup,
    element: T,
    propertyName: keyof T,
    service: { read: (objectId: string) => Promise<any> }
  ) {
    const propertyValue = element[propertyName];
    const name = propertyName as string;


    // Check if propertyValue is an object and has an 'objectId'
    if (propertyValue && typeof propertyValue === 'object' && 'objectId' in propertyValue) {
      try {
        // Attempt to fetch new data using the objectId
        this._handleObjectId(propertyValue);
        const newElementData = await service.read(propertyValue.objectId as string);
        this._handleObjectId(newElementData[propertyName]); // Assuming the new value also needs objectId handling

        // Update the element's property with new data
        element[propertyName] = newElementData;
        // Trigger change detection
        this.changeDetectorRef.markForCheck();
        // Update the form control value
        const formControl = formGroup.get(propertyName as string);
        if (formControl) {
          formControl.patchValue(newElementData, { emitEvent: true });
        } else {
          console.warn(`FormControl ${name} not found in FormGroup.`);
        }
      } catch (error) {
        console.error(`Failed to fetch data for property '${name}':`, error);
        // Optionally handle the error by setting the form control value to null or providing a fallback value
        formGroup.get(propertyName as string)?.setValue(null);
      }
    } else {
      // If propertyValue is not an object with an objectId, set the property to null
      formGroup.get(propertyName as string)?.setValue(null);
    }
  }

  /**
   * Converts the given `AliasClasse` element to a specific format.
   * @param element - The `AliasClasse` element to be converted.
   */
  _formalizer(element: AliasClasse): void {
    this.formBaseConfig._formalizer!(element);
  }

  async save(): Promise<void> {

    // currentEditElement have value initial of element(row table) on _editMode() function
    // element input on this function is value of form after submit
    this._formalizer(this.currentEditElement!);
    if (await this.aliasService.update(this.currentEditElement!)) {
      console.log(
        `${this.formBaseConfig.classDescription} mis à jour avec succès`,
        'Succès'
      );
    } else {
      console.error(
        `${this.formBaseConfig.classDescription} n'a pas pu être mis à jour`,
        'Erreur'
      );
    }

    await this._reloadElement();

    if (this.currentEditElement) {
      this._isEdit = false;
      this._disableEditControls();
      this._disable2wayBinding();
      this.toastrService.success(
        `${this.formBaseConfig.classDescription} rechargé avec succès`,
        'Succès'
      );
    } else {
      this.toastrService.error(
        'Une erreur est survenue, veuillez réessayer',
        'Erreur'
      );
    }
  }

  _editMode(excepts?: string[]) {
    this.changeDetectorRef.detach();
    this._isEdit = true;
    this._enableEditControls(excepts);
    this.changeDetectorRef.reattach();
  }

  _formatDateToInput<AcademieAudite, Key extends keyof AcademieAudite>(
    element: AcademieAudite,
    propertyName: Key
  ): string {
    const dateValue = element[propertyName];
    if (typeof dateValue === 'string' || dateValue instanceof Date) {
      const formattedDate = this._formatDateToRawMatInputValue(dateValue);
      element[propertyName as keyof AcademieAudite] = formattedDate as unknown as AcademieAudite[Key];
      return formattedDate;
    } else {
      console.error(`${String(propertyName)} is not a valid date`);
      return '00-00-0000'; // Default value in case of an error
    }
  }

  /**
   * Switches the view mode of the list table.
   * @param excepts - An optional array of strings representing properties to exclude from disabling edit controls.
   */
  async _viewMode(excepts?: string[], element?: any): Promise<void> {
    this.changeDetectorRef.detach();
    if (this._isEdit === true || ((element !== this.currentEditElement) && this.currentEditElement !== null && this._isEdit === false)) {
      await this._reloadElement();
    }
    this._isEdit = false;
    this._disableEditControls(excepts);
    this.changeDetectorRef.reattach();
    this.changeDetectorRef.detectChanges();
  }


  _enableEditControls(excepts?: string[]) {
    // Iterate over all form controls
    this._enable2wayBinding(this.currentEditElement!, this.form);
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);

      // If isEdit is true, enable the control, otherwise disable it
      if (control) {
        if (!excepts?.includes(controlName)) {
          control?.enable();
          this.changeDetectorRef.markForCheck();
        }
      } else {
        console.error('Control not found: ' + controlName);
      }
    });
  }

  _enable2wayBinding(element: Contact, formGroup: FormGroup = this.form) {
    this._disable2wayBinding(); // Disable any existing bindings first
    this._bind2wayValues(element, formGroup); // Re-bind
  }

  /**
     * Disables the edit controls of the form, except for the specified controls.
     * @param except - An optional array of control names to exclude from being disabled.
     */
  _disableEditControls(except?: string[]) {
    // Iterate over all form controls
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);

      // If isEdit is true, enable the control, otherwise disable it
      if (control) {
        if (!except?.includes(controlName)) {
          control?.disable();
          this.changeDetectorRef.markForCheck();
        }
      } else {
        console.error('Control not found: ' + controlName);
      }
    });
  }



  /**
   * Binds the two-way values between the form controls and the element row table.
   *
   * @template AcademieAudite - The type of the element.
   * @param {Contact} element - The element to bind the values to.
   * @param {FormGroup} [formGroup=this.form] - The form group containing the form controls.
   */
  _bind2wayValues(element: Contact, formGroup: FormGroup = this.form) {
    Object.keys(formGroup.controls).forEach((controlName) => {
      const subscription = formGroup
        .get(controlName)
        ?.valueChanges.subscribe((value) => {
          element[controlName as keyof Contact] = value; // Ensure you're safely accessing element properties
        });
      if (subscription) {
        this.valueChangeSubscriptions.push(subscription);
      }
    });
  }


  /**
   * Lifecycle hook that is called when the component is destroyed.
   * It unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
    this.valueChangeSubscriptions?.forEach((sub) => sub?.unsubscribe());
  }

  /**
   * Disables two-way binding by unsubscribing from all value change subscriptions.
   */
  _disable2wayBinding() {
    this.valueChangeSubscriptions.forEach((sub) => sub?.unsubscribe());
    this.valueChangeSubscriptions = []; // Clear the array after unsubscribing
  }


  /**
   * Updates a row in the data source with the provided updated element.
   *
   * @param updatedElement - The updated element to replace the existing row.
   * @returns A promise that resolves when the row is updated.
   */
  _updateRow(updatedElement: Contact): void {

    Object.assign(this.form.value, updatedElement);

    // Notify MatTable to re-render rows. This might not be necessary unless you need to force an update.
    this.changeDetectorRef.detectChanges(); // Assuming you have @ViewChild(MatTable) table: MatTable<any>;
  }





  /**
   * Reloads an element in the form and updates the table row with the updated data.
   * @param e - The element to reload.
   * @returns A promise that resolves when the element is reloaded.
   */
  async _reloadElement(): Promise<void> {
    try {
      const updatedElement = await this.aliasService.readMyContact() as Contact;
      this.authService.setUser(updatedElement);

      // If 'updatedElement' is the new data you wish to update your form with:
      // This assumes that 'updatedElement' is an object with properties matching your form controls.

      await this.loadElementWithDataComplet(updatedElement!);

      this._formGroupGetElementsvalues(updatedElement!, this.form);

      // await this.loadElementWithDataComplet(updatedElement!);
      this._updateRow(updatedElement!);

      this.changeDetectorRef.markForCheck();
    } catch (error) {
      console.error('Failed to reload element', error);
      // Handle error, maybe show a user-friendly message.
    }
  }

  /**
   * Sets the values of the form controls in the given form group based on the properties of the element (row table).
   *
   * @template AcademieAudite - The type of the element.
   * @param {AcademieAudite} element - The element containing the values to be set in the form group.
   * @param {FormGroup} formGroup - The form group to set the values in.
   */
  _formGroupGetElementsvalues<AcademieAudite extends { [key: string]: any }>(
    element: AcademieAudite,
    formGroup: FormGroup
  ) {
    Object.keys(formGroup.controls).forEach((controlName) => {
      if (element[controlName]) {
        formGroup.get(controlName)!.setValue(element[controlName]);
        this.changeDetectorRef.markForCheck();
      }
    });
  }


  /**
   * Retrieves the value of a specified property from an element and performs additional operations if the value is an object with an `objectId` property.
   * @param element - The element from which to retrieve the property value.
   * @param propertyName - The name of the property to retrieve.
   * @param service - The service used to retrieve the object by its `objectId`.
   * @returns A Promise that resolves to the updated element with the property value replaced by the retrieved object.
   */
  async _getElementValue<AcademieAudite extends { objectId?: string }>(
    element: AcademieAudite,
    propertyName: keyof AcademieAudite,
    service: { read: (objectId: string) => Promise<any> }
  ) {
    const propertyValue = element[propertyName];
    this._handleObjectId(propertyValue);
    if (
      propertyValue &&
      typeof propertyValue === 'object' &&
      'objectId' in propertyValue
    ) {
      element[propertyName] = await service.read(
        propertyValue.objectId as string
      ); // Add type assertion here
      this._handleObjectId(element[propertyName]); // Assuming the new value also needs objectId handling
      this.changeDetectorRef.markForCheck();
    } else {
      element[propertyName] = null as any;
    }
  }

  async _annule(excepts?: string[], element?: any) {
    this.isAnnuled$M.set(true);
    this.isLoading$S.set(true);

    setTimeout(async () => {
      await this._viewMode(excepts);

      this.isLoading$S.set(false);
    }, 300);
  }
}
