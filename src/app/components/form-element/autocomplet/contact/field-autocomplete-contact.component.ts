import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	Input,
	Optional,
	Renderer2,
	Self,
	SimpleChanges,
	ViewEncapsulation,
	model,
	signal
} from '@angular/core';
import {
	FormBuilder,
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
	Subscription,
	catchError,
	debounceTime,
	firstValueFrom,
	from,
	map,
	mergeMap,
	of,
	startWith,
	switchMap,
	takeUntil
} from 'rxjs';
import { EnumCategorieContact } from '../../../enums/EnumContact';
import { Contact_CdkDialogCreate } from '../../../modals/create-contact-modal/create-contact-modal.component';
import { AcademieAudite } from '../../../models/AcademieAudite';
import { Contact } from '../../../models/Contact';
import { ContactService } from '../../../services/contact/contact.service';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';
import { IOption } from './../../../models/_generic/options.interface';
import { AcademieAuditeService } from './../../../services/academie-audite/academie-audite.service';

@Component({
	selector: 'FIELD_autocomplete--contact',
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
	],
	templateUrl: './field-autocomplete-contact.component.html',
	styleUrl: './field-autocomplete-contact.component.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteContactComponent extends FormControlAutocompleteBaseDirective {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	photo: string = "/assets/images/no-profile.png";
	@Input() categoriesContactsSelect: EnumCategorieContact[] = []; // not use
	@Input() categorieContactInit: EnumCategorieContact[] = [];
	@Input() onOtherAcademie?: boolean = false; // si on veut afficher les contacts d'une autre academie -> input true
	@Input() onAllAcademie?: boolean = false; // si on veut afficher les contacts de toutes les academies -> input true
	@Input() onMyAcademie?: boolean = false;
	// par defaut on affiche les contacts de l'academie de l'utilisateur
	@Input() academieAudite_objectId?: string = '';
	@Input() categoriesContactSelectList_IOption?: IOption[];
	@Input() disableCreateContact = true;
	@Input() fixAcademieAudite?: boolean = false;
	@Input() _testView?: boolean = false;

	profilePicture = signal<string | undefined>(undefined);


	loading = false;
	filteredOptions!: Observable<Contact[]>;
	private contactsList: Contact[] = [];
	contactsDisplay$M = model<Partial<Contact>[] | undefined>();

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
	}	

	ngOnChanges(changes: SimpleChanges): void {

		if (changes['categoriesContactSelectList_IOption']) {
			this.changeDetectorRef.detectChanges();
		}

		if (changes['fixAcademieAudite']) {
			this.changeDetectorRef.detectChanges();
		}

		if (changes['_testView']) {
			this.changeDetectorRef.detectChanges();
		}
	}

	override initValues(): Promise<void> {
		// Check the initial value on initialization
		const control = this.formGroup.get(this.controlName);

		const initialValue = control?.value;
		if (initialValue?.profilePicture?.parseFile) {
			this.profilePicture.set(initialValue.profilePicture.parseFile.url);
			console.log("autocomplete img academie init:", initialValue.profilePicture.parseFile.url);
		} else {
			this.profilePicture.set("/assets/images/no-profile.png");
		}
		this.subscription.add(this.formGroup.get(this.controlName)?.valueChanges.subscribe((value) => {
			if (value?.profilePicture?.parseFile) {
				this.profilePicture.set(this.formGroup.get(this.controlName)?.value.profilePicture.parseFile.url);
				console.log("autocomplete img academie get:", value.profilePicture.parseFile.url);
			} else {
				this.profilePicture.set("/assets/images/no-profile.png")
			}
			this.changeDetectorRef.detectChanges();
		}));
		return Promise.resolve();
	}

	initFilterOptions(): void {
		// Unsubscribe from any existing subscriptions
		if (this.subscription) {
			this.subscription.unsubscribe();
		}
		this.subscription = new Subscription();

		// Set up the observable pipeline
		const filterPipeline = this.formGroup
			.get(this.controlName)!
			.valueChanges.pipe(
				startWith(''),
				debounceTime(500),
				map((value) => typeof value === 'string' ? value : value?.nom),
				switchMap((filterText) => filterText ? this._filter(filterText) : of(this.contactsList))
			);

		// Assign the observable to filteredOptions for template binding
		this.filteredOptions = filterPipeline;

		// Also subscribe to handle any side effects if needed
		this.subscription.add(
			filterPipeline.subscribe()
		);
	}

	public override ngOnDestroy(): void {
		super.ngOnDestroy();
		this.profilePicture.set(undefined);	
	}

	private refreshFilteredOptions(): void {
		// Unsubscribe from any existing subscriptions
		if (this.subscription) {
			this.subscription.unsubscribe();
		}

		// Create a new subscription
		this.subscription = new Subscription();

		// Create the filter pipeline
		const filterPipeline = this.formGroup
			.get(this.controlName)!
			.valueChanges.pipe(
				startWith(''),
				debounceTime(500),
				map((value) => typeof value === 'string' ? value : value.denominationSociale),
				switchMap((filterText) => filterText ? this._filter(filterText) : of(this.contactsList))
			);

		// Assign to filteredOptions for template binding
		this.filteredOptions = filterPipeline;

		// If you need to handle side effects, add the subscription
		// Otherwise, this can be omitted if you're only using async pipe
		this.subscription.add(
			filterPipeline.subscribe()
		);
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
		this.profilePicture.set(value.profilePicture?.parseFile?.url);
		this.valid.set(true);
		this.formControl?.markAsDirty();
		this.canClear.set(true)
		this.changeDetectorRef.detectChanges();
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
		try {
			// Show dialog
			const dialogRef = this.dialog.open(Contact_CdkDialogCreate, {
				autoFocus: false,
				height: '80%',
				width: '90%',
				data: {
					onOtherAcademie: this.onOtherAcademie,
					fixAcademieAudite: this.fixAcademieAudite,
					disableCreateContact: this.disableCreateContact,
					contactCategoriesToCreate: this.categorieContactInit,
					_testView: this._testView,
					academieAudite_objectId: await this.getAcademieAuditeObjectId_toCreate(),
					categoriesContactSelectList_IOption: this.categoriesContactSelectList_IOption
				},
			});

			// Handle dialog result with error handling and timeout
			const result = await Promise.race([
				firstValueFrom(
					dialogRef.afterClosed().pipe(
						takeUntil(this.destroy$),
						catchError((error) => {
							console.error('Dialog error:', error);
							this.toastrService.error('Une erreur est survenue lors de la fermeture de la fenêtre');
							return of(null);
						})
					)
				),
				// Optional: Add timeout to prevent hanging
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Dialog timeout')), 300000) // 5 minute timeout
				)
			]).catch(error => {
				console.error('Dialog operation failed:', error);
				dialogRef.close(); // Ensure dialog is closed on error
				this.toastrService.error('Une erreur est survenue');
				return null;
			});

			// Handle successful result
			if (result) {
				try {
					const newContact = await this.contactService.read(result.objectId);
					this.contactsList = [newContact] as Contact[];
					this.refreshFilteredOptions();
					this.changeDetectorRef.markForCheck();
				} catch (error) {
					console.error('Error reading contact:', error);
					this.toastrService.error('Une erreur est survenue lors de la lecture du contact');
				}
			}
		} catch (error) {
			// Handle any errors in the entire operation
			console.error('Dialog create operation failed:', error);
			this.toastrService.error('Une erreur est survenue lors de la création du contact');
		} finally {
			// Cleanup
			this.loading = false;
			this.changeDetectorRef.markForCheck();
		}
	}

	getErrorMessage() {
		if (this.formGroup?.get(this.controlName)?.errors?.['required']) {
			return `${this.fieldName} est requis`;
		}
		// Add more error type checks as needed
		return 'Invalid field';
	}
}
