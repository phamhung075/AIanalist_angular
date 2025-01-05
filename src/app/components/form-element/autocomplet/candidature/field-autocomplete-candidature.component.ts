import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	Optional,
	Renderer2,
	Self,
	ViewEncapsulation,
} from '@angular/core';
import {
	FormBuilder,
	FormGroup,
	NgControl,
	ReactiveFormsModule,
} from '@angular/forms';
import {
	MatAutocompleteModule,
	MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
	Observable,
	Subscription,
	catchError,
	debounceTime,
	from,
	map,
	mergeMap,
	of,
	startWith,
	switchMap,
	takeUntil,
} from 'rxjs';
import { AcademieAudite } from '../../../models/AcademieAudite';
import { Candidature } from '../../../models/Candidature';
import { Contact } from '../../../models/Contact';
import { AcademieAuditeService } from '../../../services/academie-audite/academie-audite.service';
import { CandidatureService } from '../../../services/candidature/candidature.service';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';
import { ContactService } from './../../../services/contact/contact.service';
import { ProgrammeFormation } from '../../../models/ProgrammeFormation';
import { ProgrammeFormationService } from './../../../services/programme-formation/programme-formation.service';
import { EnumStatutCandidature } from '../../../enums/EnumCandidature';

@Component({
	selector: 'FIELD_autocomplete--candidature',
	templateUrl: './field-autocomplete-candidature.component.html',
	styleUrl: '../../../scss/autocomplete.scss',
	standalone: true,
	imports: [
		CommonModule,
		MatIconModule,
		MatInputModule,
		MatSelectModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatAutocompleteModule,
		MatProgressSpinnerModule,
	],
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteCandidatureComponent extends FormControlAutocompleteBaseDirective {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() step?: EnumStatutCandidature = EnumStatutCandidature.ACCEPT;

	@Input() isRequired?: boolean = false;
	@Input() disabled: boolean = false;

	loading = false;
	filteredOptions!: Observable<Candidature[]>;

	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private candidatureService: CandidatureService,
		private academieAuditeService: AcademieAuditeService,
		private programmeFormationService: ProgrammeFormationService,

		changeDetectorRef: ChangeDetectorRef,
		private contactService: ContactService,
		el: ElementRef,
		renderer: Renderer2
	) {
		super(formBuilder, el, renderer, changeDetectorRef);
		if (this.ngControl != null) {
			this.ngControl.valueAccessor = this;
		}
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
				map((value) => typeof value === 'string' ? value : value?.numeroDossier),
				switchMap((filterText) => filterText ? this._filter(filterText) : of([]))
			);

		// Assign the observable to filteredOptions for template binding
		this.filteredOptions = filterPipeline;

		// Also subscribe to handle any side effects if needed
		this.subscription.add(
			filterPipeline.subscribe()
		);
	}

	private _filter(filterText: string): Observable<Candidature[]> {

		// Directly start with checking the filterText length and fetching data if valid.
		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Immediately return an empty array if the search term is too short.
		}

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		return from(this.candidatureService.fetchPageWithStep(filterText, 1, 10 )).pipe(
			mergeMap(async (response) => {
				this.loading = false;
				if (response?.data) {
					// Use Promise.all to wait for all promises to resolve
					await Promise.all(response.data.map(async (candidature) => {
						this._handleObjectId(candidature.academieAudite);
						candidature.academieAudite = await this.getAcademieAuditeValue(candidature) as AcademieAudite | null;
						candidature.contactBeneficiaire = await this.getContactBeneficiaireValue(candidature) as Contact | null;
						candidature.programmeFormation = await this.getProgrammeFormationValue(candidature) as ProgrammeFormation | null;
						candidature.debutSession = this._formatDateToInput(candidature, "debutSession");
						candidature.dateEntretienMiParcours = this._formatDateToInput(candidature, "dateEntretienMiParcours");
						candidature.finSession = this._formatDateToInput(candidature, "finSession");
						candidature.dateAcceptation = this._formatDateToInput(candidature, "dateAcceptation");
					}));
				}
				return response?.data ?? []; // Assuming response has a results property that is an array of Candidature.
			}),
			catchError((error) => {
				console.error(error);
				this.loading = false;
				return of([]); // On error, return an empty array.
			})
		);
	}

	async getAcademieAuditeValue(candidature: Candidature): Promise<Partial<AcademieAudite> | null> {
		this._handleObjectId(candidature.academieAudite);
		if (candidature?.academieAudite?.objectId) {
			const academieAudite = await this.academieAuditeService.read(
				candidature?.academieAudite!.objectId!
			);
			this._handleObjectId(candidature.academieAudite);

			this.changeDetectorRef.markForCheck();

			return academieAudite as Partial<AcademieAudite> | null;
		} else {
			return null;
		}
	}


	async getContactBeneficiaireValue(candidature: Candidature): Promise<Partial<AcademieAudite> | null> {
		this._handleObjectId(candidature.contactBeneficiaire);
		if (candidature?.contactBeneficiaire?.objectId) {
			const contactBeneficiaire = await this.contactService.read(
				candidature?.contactBeneficiaire!.objectId!
			);
			this._handleObjectId(candidature.contactBeneficiaire);

			this.changeDetectorRef.markForCheck();

			return contactBeneficiaire as Partial<Contact> | null;
		} else {
			return null;
		}
	}

	async getProgrammeFormationValue(candidature: Candidature): Promise<Partial<ProgrammeFormation> | null> {
		this._handleObjectId(candidature.programmeFormation);
		if (candidature?.programmeFormation?.objectId) {
			const programmeFormation = await this.programmeFormationService.read(
				candidature?.programmeFormation!.objectId!
			);
			this._handleObjectId(candidature.programmeFormation);

			this.changeDetectorRef.markForCheck();

			return programmeFormation as Partial<ProgrammeFormation> | null;
		} else {
			return null;
		}
	}



	displayFn(candidature?: Partial<Candidature>): string {
		const numeroDossier = candidature?.numeroDossier ? candidature.numeroDossier : '';
		const statut = candidature?.statut ? ' (' + candidature.statut + ')' : '';
		const type = candidature?.type ? ' (' + candidature.type + ')' : '';
		const academieAudite = candidature?.academieAudite ? ' (' + candidature.academieAudite.denominationSociale + ')' : '';
		const contactBeneficiaire = candidature?.contactBeneficiaire ? ' (' + candidature.contactBeneficiaire.nom + ' ' + candidature.contactBeneficiaire.prenom + ' - ' + candidature.contactBeneficiaire.email + ')' : '';

		return numeroDossier + statut + type + academieAudite + contactBeneficiaire;
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: Candidature = event.option.value;
		if (!value) {
			return;
		}
		this.formControl?.setValue(value);
		this.valid.set(true);
		this.formControl?.markAsDirty();
		this.canClear.set(true)
		this.changeDetectorRef.detectChanges();
	}

	getErrorMessage() {
		if (this.formGroup?.get(this.controlName)?.errors?.['required']) {
			return `${this.fieldName} est requis`;
		}
		// Add more error type checks as needed
		return 'Invalid field';
	}


	protected _formatDateToInput<T, K extends keyof T>(
		element: T,
		propertyName: K
	): string {
		const dateValue = element[propertyName];
		if (typeof dateValue === 'string' || dateValue instanceof Date) {
			const formattedDate = this._formatDateToRawMatInputValue(dateValue);
			element[propertyName as keyof T] = formattedDate as unknown as T[K];
			return formattedDate;
		} else {
			console.error(`${String(propertyName)} is not a valid date`);
			return '00-00-0000'; // Default value in case of an error
		}
	}

	protected _formatDateToRawMatInputValue(date: string | Date): string {
		// If the date is a string, try to convert it to a Date object
		const dateObj = typeof date === 'string' ? new Date(date) : date;

		const year = dateObj.getFullYear();
		const month = dateObj.getMonth() + 1; // getMonth() is zero-indexed
		const day = dateObj.getDate();

		// Format month and day to ensure they are two digits
		const formattedMonth = month < 10 ? `0${month}` : month.toString();
		const formattedDay = day < 10 ? `0${day}` : day.toString();

		return `${year}-${formattedMonth}-${formattedDay}`;
	}

}
