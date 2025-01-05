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
	ViewChild,
	ViewEncapsulation,
	signal,
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
} from 'rxjs';
import { AcademieAudite } from '../../../models/AcademieAudite';
import { AcademieAuditeService } from '../../../services/academie-audite/academie-audite.service';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';

@Component({
	selector: 'FIELD_autocomplete--academie-audite',
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
	templateUrl: './field-autocomplete-academie-audite.component.html',
	styleUrl: './field-autocomplete-academie-audite.component.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteAcademieAuditeComponent extends FormControlAutocompleteBaseDirective {
	@ViewChild('value') value?: ElementRef<HTMLInputElement>;

	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	@Input() _testView?: boolean = false;

	logoImage = signal<string | undefined>(undefined);

	loading = false;
	filteredOptions!: Observable<AcademieAudite[]>;
	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private academieAuditeService: AcademieAuditeService,
		el: ElementRef,
		renderer: Renderer2,
		changeDetectorRef: ChangeDetectorRef,
	) {
		super(formBuilder, el, renderer, changeDetectorRef);
		if (this.ngControl != null) {
			this.ngControl.valueAccessor = this;
		}
	}

	override initValues(): Promise<void> {
		// Check the initial value on initialization
		const control = this.formGroup.get(this.controlName);

		const initialValue = control?.value;
		if (initialValue?.logoImage?.parseFile) {
			this.logoImage.set(initialValue.logoImage.parseFile.url);
			console.log("autocomplete img academie init:", initialValue.logoImage.parseFile.url);
		} else {
			this.logoImage.set("/assets/images/no-logo.png");
		}
		this.subscription.add(this.formGroup.get(this.controlName)?.valueChanges.subscribe((value) => {
			if (value?.logoImage?.parseFile) {
				this.logoImage.set(this.formGroup.get(this.controlName)?.value.logoImage.parseFile.url);
				console.log("autocomplete img academie get:", value.logoImage.parseFile.url);
			} else {
				this.logoImage.set("/assets/images/no-logo.png")
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

	private _filter(filterText: string): Observable<AcademieAudite[]> {
		this.setControlInvalid(); // Set invalid if filterText is too short but not empty.

		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Return empty array if the search term is too short.
		}

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		return from(this.academieAuditeService.fetchPage(filterText, 1, 10)).pipe(
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

	displayFn(option: any): string {
		// Ensure option exists and has the properties you expect
		if (
			option &&
			option.denominationSociale &&
			option.codePostal &&
			option.ville
		) {
			return `${option.denominationSociale} ${option.adresse} ${option.codePostal} ${option.ville}`;
		}
		return ''; // Return empty string or some default value if option is not valid
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: AcademieAudite = event.option.value;
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
