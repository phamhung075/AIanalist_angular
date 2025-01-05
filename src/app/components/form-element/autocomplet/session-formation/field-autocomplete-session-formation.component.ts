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
	switchMap
} from 'rxjs';
import { SessionFormation } from '../../../models/SessionFormation';
import { SessionFormationService } from '../../../services/session-formation/session-formation.service';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';

@Component({
	selector: 'FIELD_autocomplete--session-formation',
	templateUrl: './field-autocomplete-session-formation.component.html',
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
	],
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteSessionFormationComponent extends FormControlAutocompleteBaseDirective {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	@Input() disabled: boolean = false;
	@Input() academieAudite_objectId?: string;

	loading = false;
	filteredOptions!: Observable<SessionFormation[]>;

	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private sessionFormationService: SessionFormationService,
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
		if (this.formControl && !this.formControl?.value) {
			const address =
				this.formControl?.value?.session +
				' ' +
				this.formControl?.value?.codePostal +
				' ' +
				this.formControl?.value?.ville +
				' ' || '';
			const baseUrl = 'https://www.google.fr/maps/search/';
			const fullUrl = `${baseUrl}${encodeURIComponent(address)}`;
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
				map((value) => typeof value === 'string' ? value : value?.sessionFormation),
				switchMap((filterText) => filterText ? this._filter(filterText) : of([]))
			);

		// Assign the observable to filteredOptions for template binding
		this.filteredOptions = filterPipeline;

		// Also subscribe to handle any side effects if needed
		this.subscription.add(
			filterPipeline.subscribe()
		);
	}

	private _filter(filterText: string): Observable<SessionFormation[]> {
		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Retourne un tableau vide si le terme de recherche est trop court.
		}

		this.loading = true;
		return from(this.sessionFormationService.fetchPageByAcademieObjectId_Autocomplete(filterText, this.academieAudite_objectId, 1, 10)).pipe(
			map((response) => {
				this.loading = false;
				return response.results;
			}),
			catchError((error) => {
				console.error(error);
				this.loading = false;
				return of([]);
			})
		);
	}

	displayFn(sessionFormation?: SessionFormation): string {
		if (!sessionFormation) {
			return 'Session de formation non spécifiée';
		}

		// Supposons que chaque bénéficiaire a un attribut 'nom'
		const nomsDesBeneficiaires = sessionFormation.beneficiaire?.map(b => b.nom).join(', ') ?? 'Aucun bénéficiaire';

		return `Session avec les bénéficiaires: ${nomsDesBeneficiaires}`;
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: SessionFormation = event?.option?.value;
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
}
