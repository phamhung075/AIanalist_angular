import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	Optional,
	Renderer2,
	Self,
	SimpleChanges,
	ViewEncapsulation,
	computed,
	effect,
	model,
	signal
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
	FormBuilder,
	FormControl,
	FormGroup,
	NgControl,
	ReactiveFormsModule
} from '@angular/forms';
import {
	MatAutocompleteModule,
	MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import {
	Observable,
	Subject,
	Subscription,
	catchError,
	debounceTime,
	distinctUntilChanged,
	firstValueFrom,
	from,
	map,
	mergeMap,
	of,
	shareReplay,
	startWith,
	switchMap,
	takeUntil
} from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { EnumCategorieContact } from '../../../enums/EnumContact';
import { Contact_CdkDialogCreate } from '../../../modals/create-contact-modal/create-contact-modal.component';
import { Contact } from '../../../models/Contact';
import { IOption } from '../../../models/_generic/options.interface';
import { FormControlAutocompleteBaseDirective } from '../../autocomplet/form-control-autocomplete-base.directive';
import { AcademieAudite } from '../../../models/AcademieAudite';
import { ContactService } from '../../../services/contact/contact.service';
import { AcademieAuditeService } from '../../../services/academie-audite/academie-audite.service';



@Component({
	selector: 'FIELD_autocomplete--contact-multi',
	standalone: true,
	imports: [
		CommonModule,
		MatIconModule,
		MatInputModule,
		MatSelectModule,
		MatCardModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatAutocompleteModule,
		MatProgressSpinnerModule,
		MatButtonModule,
	],
	templateUrl: './field-autocomplete-contact-multi.component.html',
	styleUrl: './field-autocomplete-contact-multi.component.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteContactMultiComponent extends FormControlAutocompleteBaseDirective implements OnInit, OnDestroy, OnChanges {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	photo: string = "/assets/images/no-procontact.png";
	@Input() categoriesContactsSelect?: EnumCategorieContact[] = [];
	@Input() categorieContactInit: EnumCategorieContact[] = [];
	@Input() _testView?: Boolean = false;
	@Input() onOtherAcademie?: boolean = false; // si on veut afficher les contacts d'une autre academie -> input true
	@Input() onAllAcademie?: boolean = false; // si on veut afficher les contacts de toutes les academies -> input true
	@Input() onMyAcademie?: boolean = false;
	@Input() academieAudite_objectId?: string = '';
	@Input() categoriesContactSelectList_IOption?: IOption[];
	@Input() disableCreateContact?: boolean = false;
	@Input() _isEdit?: boolean = false;

	loading = false;
	filteredOptions!: Observable<Contact[]>;
	filteredOptions$S = signal<Contact[]>([]);
	contactsDisplay$M = model<Partial<Contact>[] | undefined>();
	control?: FormControl;
	private contactsList: Contact[] = [];

	needReLoadFile$M = model(false);
	isRestored$M = model(false);
	isAnnuled$M = model(false);
	isExplanded$S = signal<boolean>(false);
	contactsLenght$S = computed(() => Array(this.contactsDisplay$M()).length);
	needReLoadContact$M = model(false);
	isEdit$S = signal(false);
	currentEditContact$M = model<Partial<Contact>[] | undefined>([]);

	contactInput$S = toSignal(
		toObservable(this.currentEditContact$M).pipe(
			distinctUntilChanged((prev, curr) =>
				JSON.stringify(prev) === JSON.stringify(curr)
			),
			switchMap(contacts =>
				from(this.formalizer(contacts || []))
			),
			shareReplay(1)
		)
	);

	isAnnuledSubscription$: Subscription = new Subscription();
	contactAdd: string[] = []
	contactDelete: string[] = []
	// createBy?: Partial<Contact>;


	constructor(
		formBuilder: FormBuilder,
		private contactService: ContactService,
		private academieAuditeService: AcademieAuditeService,
		@Optional() @Self() public ngControl: NgControl,
		private toastrService: ToastrService,

		private dialog: MatDialog,
		@Inject(MAT_DIALOG_DATA) data: any,
		changeDetectorRef: ChangeDetectorRef,
		el: ElementRef,
		renderer: Renderer2
	) {
		super(formBuilder, el, renderer, changeDetectorRef);
		if (this.ngControl != null) {
			this.ngControl.valueAccessor = this;
		}

		this.isAnnuledSubscription$ = toObservable(this.isAnnuled$M)
			.pipe(
				takeUntil(this.destroy$)  // Add this to automatically unsubscribe
			)
			.subscribe(async (isAnnuled) => {
				if (isAnnuled) {
					const isRestored = await this.restoreAndCleanContacts();
					if (isRestored) {
						this.isRestored$M.set(true);
					} else {
						this.toastrService.error('Erreur lors de la restauration des contacts');
					}
				}
			});
	}
	override async ngOnInit(): Promise<void> {
		await super.ngOnInit();
		if (this.formGroup && this.controlName) {

			this.control = this.formGroup?.get(this.controlName!) as FormControl;

		}
		this.initFilterOptions()
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		this.isAnnuledSubscription$.unsubscribe();
		this.destroy$.next();
		this.destroy$.complete();
	}

	ngOnChanges(changes: SimpleChanges): void {

		if (changes['categorieContactInit']) {
			if (this.categorieContactInit?.includes(EnumCategorieContact.PRESIDENT_ACADEMIE)) {
				this.disableCreateContact = true;
			}
		}
		if (changes['categoriesContactSelectList_IOption']) {
			this.changeDetectorRef.detectChanges();
		}
		if (changes["_isEdit"]) {
			if (this._isEdit)
				this.isEdit$S.set(this._isEdit);
		}
	}

	async getContactValue(contact: Partial<Contact> | undefined) {
		this._handleObjectId(contact);
		if (contact!.objectId && contact) {
			contact = await this.contactService.read(contact.objectId!) as Contact;
			if (contact) {
				this.changeDetectorRef.markForCheck();

				this._handleObjectId(contact);
			}
			else {
				console.error('Contact not found on getContactsValue mat-contact-select');
				contact = undefined;
			}
		} else {
			contact = undefined;
		}
		return contact;
	}


	async formalizer(elements: Partial<Contact>[] | undefined): Promise<Contact[]> {
		// Get the current contacts (ensure it’s an array)
		const currentContacts = this.contactsDisplay$M() || [];
		const array: Array<Contact> = [...currentContacts]; // Copy the current contacts

		if (elements) {
			for (let index = 0; index < elements.length; index++) {
				const element = elements[index];

				if (!element || !element['objectId']) {
					console.error('Element objectId not found on formalizer mat-contact-select');
					continue; // Skip to the next iteration
				}

				// Check if the contact already exists in contactsDisplay$M
				const contactExists = currentContacts.some(contact => contact.objectId === element.objectId);

				if (contactExists) {
					// Skip this contact if it already exists
					console.log(`Contact with objectId ${element.objectId} already exists, skipping...`);
					continue;
				}

				// If contact doesn't exist, fetch it using getContactValue
				const contact = await this.getContactValue(element) as Partial<Contact>;

				if (!contact) {
					console.error('Contact not found or deleted');
					this.removeContactFromContacts(index); // Remove contact if not found
					continue; // Skip to the next iteration
				}

				// Add the fetched contact to the array
				array.push({
					...contact,
				});
			}
		}

		// Update the signal with the final array of contacts
		this.contactsDisplay$M.set(array as Contact[]);

		return array as Contact[];
	}

	private removeContactFromContacts(index: number): void {
		const contacts = this.formGroup?.get('contacts')?.value;
		if (contacts) {
			if (index >= 0 && index < contacts.length) {
				contacts.splice(index, 1); // Remove item at the specified index
			} else {
				console.error(`Index ${index} is out of bounds for contacts array`);
			}
			this.formGroup?.get('contacts')?.setValue(contacts);
		} else {
			console.error('Array contacts not found in form group');
		}
	}


	async restoreAndCleanContacts(): Promise<boolean> {
		const allRestored = await this.restoreDeletedContacts();
		//console.log('allRestored:', allRestored);

		return allRestored;
	}



	async restoreDeletedContacts(): Promise<boolean> {
		const contacts = this.currentEditContact$M();
		//console.log('formalizer with elements', elements);
		let allRestored = false;

		const array: Array<any> = [];
		if (contacts) {
			for (let index = 0; index < contacts.length; index++) {
				const element = contacts[index];
				if (!element || !element['objectId']) {
					console.error('Element objectId not found on formalizer mat-contact-select');
					continue; // Skip to the next iteration
				}
				const contact = await this.getContactValue(element) as Partial<Contact>;
				if (!contact) {
					console.error('Contact not found or deleted');
					this.removeContactFromContacts(index); // Updated here
					continue; // Skip to the next iteration
				}
				//console.log('formalizer with contact', contact);
				array.push({
					...contact,
				});
			}
			allRestored = true;
		}
		//console.log('formalizer with array', array);
		this.contactsDisplay$M.set(array as Contact[]);


		if (allRestored) {
			// this.toastrService.info('Backup files restored successfully.');
		} else {
			this.toastrService.warning('Backup files restoration completed with some errors.');
		}

		return allRestored;
	}


	async deleteAddedContacts(): Promise<boolean> {
		let allDeleted = true;

		// Ensure `fileAdd` is an array
		if (!Array.isArray(this.contactAdd)) {
			this.toastrService.error('contactAdd is not an array. Error restoring files.');
			return false;
		}

		if (this.contactAdd.length === 0) {
			return true;
		}

		// Clear `fileAdd` after deletion attempt
		if (allDeleted) {
			this.toastrService.info('All files added previously have been deleted.');
			const remainingContacts = this.contactsDisplay$M()
				?.filter((contact) => !this.contactAdd.includes(contact.objectId!)) ?? [];

			this.contactsDisplay$M.set(remainingContacts);
			this.contactAdd = []; // Clear the `fileAdd` array after deletion
		}

		return allDeleted;
	}



	initFilterOptions(): void {
		const control = this.formGroup.get(this.controlName);
		if (control) {
			control.valueChanges.pipe(
				startWith(control.value || ''),
				debounceTime(300),  // Reduced from 500ms to 300ms for faster response
				switchMap(value => {
					const filterText = typeof value === 'string' ? value : value?.nom;
					return filterText ? this._filter(filterText) : of([]);
				}),
				takeUntil(this.destroy$)  // Ensure subscription is cleaned up on component destroy
			).subscribe({
				next: (results) => {
					console.log('Filtered options updated:', results);
					this.filteredOptions$S.set(results);
				},
				error: (error) => console.error('Error updating filtered options:', error)
			});
		}
	}


	private _filter(filterText: string): Observable<Contact[]> {

		// Directly start with checking the filterText length and fetching data if valid.
		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Immediately return an empty array if the search term is too short.
		}
		const [categorieContactInit] = this.categorieContactInit;

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		if (this.onMyAcademie) {
			return from(this.contactService.fetchContactOnMyAcademie_Autocomplete(
				filterText,
				this.academieAudite_objectId,
				1,
				10,
				categorieContactInit,
				this.onMyAcademie
			)).pipe(
				mergeMap(async (response) => {
					this.loading = false;
					return response?.data ?? []; // Assuming response has a 'results' property that is an array of AcademieAudite.
				}),
				catchError((error) => {
					console.error(error);
					this.loading = false;
					return of([]); // On error, return an empty array.
				})
			);
		}

		if (this.onAllAcademie) {
			return from(this.contactService.fetchPageWithCategorie(
				filterText,
				1,
				10,
				categorieContactInit,
			)).pipe(
				mergeMap(async (response) => {
					this.loading = false;
					return response?.data ?? []; // Assuming response has a 'results' property that is an array of AcademieAudite.
				}),
				catchError((error) => {
					console.error(error);
					this.loading = false;
					return of([]); // On error, return an empty array.
				})
			);
		}


		// if (this.onOtherAcademie) {
		// 	return from(this.contactService.fetchPageByAcademieObjectId_Autocomplete(
		// 		filterText,
		// 		this.academieAudite_objectId,
		// 		1,
		// 		10,
		// 		categorieContactInit,
		// 		this.onOtherAcademie
		// 	)).pipe(
		// 		map((response) => {
		// 			this.loading = false;
		// 			return response.results; // Assuming response has a results property that is an array of Entreprise.
		// 		}),
		// 		catchError((error) => {
		// 			console.error(error);
		// 			this.loading = false;
		// 			return of([]); // On error, return an empty array.
		// 		})
		// 	);
		// }

		return from(this.contactService.fetchPageByAcademieObjectId_Autocomplete(
			filterText,
			this.academieAudite_objectId,
			1,
			10,
			categorieContactInit,
			this.onOtherAcademie
		)).pipe(
			map((response) => {
				this.loading = false;
				return response?.data ?? []; // Assuming response has a 'results' property that is an array of AcademieAudite.
			}),
			catchError((error) => {
				console.error(error);
				this.loading = false;
				return of([]); // On error, return an empty array.
			})
		);
	}

	async getAcademieAuditeValue(
		contact: Contact
	): Promise<AcademieAudite> {

		if (contact.academieAudite?.objectId) {
			const academieAuditeValue = await this.academieAuditeService.read(
				contact.academieAudite?.objectId!
			);

			this._handleObjectId(academieAuditeValue);

			this.changeDetectorRef.markForCheck();

			return academieAuditeValue as AcademieAudite;
		} else {
			return {} as AcademieAudite;
		}
	}

	displayFn(contact?: Partial<Contact>): string {
		const nom = contact?.nom ? contact.nom : '';
		const prenom = contact?.prenom ? ' ' + contact.prenom : '';
		const email = contact?.email ? ' (' + contact.email + ')' : '';
		return nom + prenom + email;
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: Contact = event.option.value;
		if (!value) {
			return;
		}
		this.formControl?.setValue(value);
		this.valid.set(true);
		this.formControl?.markAsDirty();
	}

	//open create contact dialog
	async getAcademieAuditeObjectId_toCreate() {

		if (this.onOtherAcademie) {
			if (this.academieAudite_objectId) return this.academieAudite_objectId;
		}
		if (this.onAllAcademie) {
			if (this.academieAudite_objectId) return this.academieAudite_objectId;
		}
		const myAcademie = await this.academieAuditeService.readMyAcademieAudite() as AcademieAudite;
		return myAcademie.objectId as string ?? '';
	}

	async openDialogCreate(): Promise<void> {
		if (this.categorieContactInit?.includes(EnumCategorieContact.PRESIDENT_ACADEMIE)) {
			this.academieAudite_objectId = ""
			this.toastrService.warning("Vous devez créer academie avant de créer un contact président", "Attention");
		}
		const data = {
			onOtherAcademie: this.onOtherAcademie,
			contactCategoriesToCreate: this.categorieContactInit,
			testView: this._testView,
			academieAudite_objectId: await this.getAcademieAuditeObjectId_toCreate(),
			categoriesContactSelectList_IOption: this.categoriesContactSelectList_IOption
		}
		this.changeDetectorRef.markForCheck();
		const dialogRef = this.dialog.open(Contact_CdkDialogCreate, {
			autoFocus: false,
			height: '80%',
			width: '90%',
			data: data,
		});

		// Use firstValueFrom to convert the afterClosed Observable to a Promise

		const result = await firstValueFrom(dialogRef.afterClosed());

		if (result) {
			const newContact = await this.contactService.read(result.objectId);
			this.contactsList = [newContact] as Contact[]; // Assuming result is of type Contact
			this.initFilterOptions();
		}
	}

	getErrorMessage() {
		if (this.formGroup?.get(this.controlName)?.errors?.['required']) {
			return `${this.fieldName} est requis`;
		}
		// Add more error type checks as needed
		return 'Invalid field';
	}

	selectContact(option: any): void {
		//console.log(option);
		// Here you can also handle other logic, like updating data or state
	}
	optionClicked(event: Event) {
		event.stopPropagation();
		// this.toggleSelection(user);
	}

	handleSelectContact(contact: Partial<Contact>): void {
		// Directly filter and update the signal without using pipe
		const currentOptions = this.filteredOptions$S(); // Get the current state of the signal
		const updatedOptions = currentOptions.filter(option => option.objectId !== contact.objectId);
		this.filteredOptions$S.set(updatedOptions); // Set the updated state

		// Get the current state of the model
		const currentSelectedOptions = this.contactsDisplay$M() ?? []; // Get the current state of the signal
		if (!Array.isArray(currentSelectedOptions)) {
			console.error('contactsDisplay is not an array:', currentSelectedOptions);
			return;
		}
		// Check if the contact already exists in the selected options
		if (!currentSelectedOptions.some(option => option.objectId === contact.objectId)) {
			currentSelectedOptions.push(contact); // Update the array only if contact does not exist
		} else {
			this.toastrService.info("Contact already selected");
		}
		this.formControl?.markAsDirty();
		this.formControl?.markAsTouched();
		this.formControl.patchValue(currentSelectedOptions, { emitEvent: true });
		this.currentEditContact$M.set(currentSelectedOptions);
	}

}