import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnChanges,
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
import {
	MatFormFieldModule,
} from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
	Observable,
	Subject,
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
import { Entreprise } from '../../../models/Entreprise';
import { EntrepriseService } from '../../../services/entreprise/entreprise.service';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';

@Component({
	selector: 'FIELD_autocomplete--entreprise',
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
	templateUrl: './field-autocomplete-entreprise.component.html',
	styleUrl: './field-autocomplete-entreprise.component.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteEntrepriseComponent extends FormControlAutocompleteBaseDirective implements OnChanges {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	@Input() disabled?: boolean = false;
	@Input() academieAudite_objectId?: string;
	@Input() _testView?: boolean = false;

	logoImage = signal<string | undefined>(undefined);


	loading = false;
	filteredOptions!: Observable<Entreprise[]>;

	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private entrepriseService: EntrepriseService,
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


	override initValues(): Promise<void> {		
		this.logoImage.set(undefined);

		this.subscription.add(this.formGroup.get(this.controlName)?.valueChanges.subscribe((value) => {
			if (value?.logoImage?.parseFile?.url) {
				this.logoImage.set(value.logoImage.parseFile.url);
				console.log("autocomplete img entreprise get:",value.logoImage.parseFile.url);
			} else {
				this.logoImage.set(undefined)
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
				switchMap((filterText) => filterText ? this._filter(filterText) : of([]))
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
		this.logoImage.set(undefined);	
	}	


	private _filter(filterText: string): Observable<Entreprise[]> {

		// Directly start with checking the filterText length and fetching data if valid.
		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Immediately return an empty array if the search term is too short.
		}

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		return from(this.entrepriseService.fetchPageByAcademieObjectId_Autocomplete(filterText, this.academieAudite_objectId, 1, 10)).pipe(
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

	displayFn(entreprise?: Partial<Entreprise>): string {
		return entreprise && entreprise.denominationSociale
			? entreprise.denominationSociale + ' (' + entreprise.ville + ' ' + entreprise.codePostal + ')'
			: '';
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: Entreprise = event.option.value;
		if (!value) {
			return;
		}
		this.formControl?.setValue(value);
		this.logoImage.set(value.logoImage?.parseFile?.url);
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
