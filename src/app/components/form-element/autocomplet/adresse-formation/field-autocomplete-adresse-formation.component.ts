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
	signal,
	SimpleChanges,
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
	of,
	startWith,
	switchMap,
	takeUntil,
} from 'rxjs';
import { AdresseFormation } from '../../../models/AdresseFormation';
import { AdresseFormationService } from '../../../services/adresse-formation/adresse-formation.service';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';
import { DisplayGoogleMapComponent } from '../../../components/display-google-map/display-google-map.component';

@Component({
	selector: 'FIELD_autocomplete--adresse-formation',
	templateUrl: './field-autocomplete-adresse-formation.component.html',
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
		MatIconModule,
		DisplayGoogleMapComponent
	],
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteAdresseFormationComponent extends FormControlAutocompleteBaseDirective {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	@Input() disabled: boolean = false;
	@Input() academieAudite_objectId?: string;

	loading = false;
	filteredOptions!: Observable<AdresseFormation[]>;

	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private adresseFormationService: AdresseFormationService,
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
		if (changes['academieAudite_objectId']) {
			if (this.academieAudite_objectId || this.academieAudite_objectId === '') {
				if (this.formControl && this.formControl?.value) { // Check if formControl exists
					this.formControl?.reset();
				}
				this.changeDetectorRef.detectChanges();
			}
		}
	}

	getGoogleMapsUrl(): string {
		if (this.formControl && this.formControl?.value) {
			const address =
				this.formControl?.value?.adresse +
				' ' +
				this.formControl?.value?.codePostal +
				' ' +
				this.formControl?.value?.ville +
				' ' || '';
			const baseUrl = 'https://www.google.fr/maps/search/';
			const fullUrl = `${baseUrl}${encodeURIComponent(address)}`;
			//console.log("fullUrl", fullUrl)

			return fullUrl;
		}
		return '';
	}
	openGoogleMaps() {
		const url = this.getGoogleMapsUrl();
		window.open(url, '_blank');
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
				map((value) => typeof value === 'string' ? value : value?.labelAdresse),
				switchMap((filterText) => filterText ? this._filter(filterText) : of([]))
			);

		// Assign the observable to filteredOptions for template binding
		this.filteredOptions = filterPipeline;

		// Also subscribe to handle any side effects if needed
		this.subscription.add(
			filterPipeline.subscribe()
		);
	}

	private _filter(filterText: string): Observable<AdresseFormation[]> {
		this.setControlInvalid(); // Set invalid if filterText is too short but not empty.

		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Return empty array if the search term is too short.
		}

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		return from(this.adresseFormationService.fetchPageByAcademieObjectId_Autocomplete(filterText, this.academieAudite_objectId, 1, 10)).pipe(
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

	displayFn(adresseFormation?: Partial<AdresseFormation>): string {
		const labelAdresse = adresseFormation?.labelAdresse
			? adresseFormation?.labelAdresse
			: '';
		const adresse = adresseFormation?.adresse
			? ' (' + adresseFormation?.adresse + ')'
			: '';
		const codePostal = adresseFormation?.codePostal
			? ' (' + adresseFormation?.codePostal + ')'
			: '';
		const ville = adresseFormation?.ville
			? ' (' + adresseFormation?.ville + ')'
			: '';

		return labelAdresse + adresse + codePostal + ville;
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: AdresseFormation = event?.option?.value;
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

	address(adresseFormation: any) {
		// Combine the fields of 'lieu' to form a full address
		console.log(adresseFormation);
		return signal(`${adresseFormation.adresse}, ${adresseFormation.ville}, ${adresseFormation.codePostal}, ${adresseFormation.region}, ${adresseFormation.pays}`);
	}
}
