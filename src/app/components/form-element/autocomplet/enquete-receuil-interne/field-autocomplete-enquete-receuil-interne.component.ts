import { MatIconModule } from '@angular/material/icon';
import {
	MatFormFieldModule,
} from '@angular/material/form-field';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	NgControl,
} from '@angular/forms';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnChanges,
	OnDestroy,
	Optional,
	Renderer2,
	Self,
	SimpleChanges,
	ViewEncapsulation,
} from '@angular/core';
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
import {
	MatAutocompleteModule,
	MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { EnqueteRecueilInterne } from '../../../models/EnqueteRecueil';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';
import { EnqueteRecueilInterneService } from '../../../../public-api';

@Component({
	selector: 'FIELD_autocomplete--enquete-receuil-interne',
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
	templateUrl: './field-autocomplete-enquete-receuil-interne.component.html',
	styleUrl: '../../../scss/autocomplete.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteEnqueteRecueilInterneComponent extends FormControlAutocompleteBaseDirective implements OnDestroy, OnChanges {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	@Input() disabled: boolean = false;
	@Input() academieAudite_objectId?: string;

	loading = false;
	filteredOptions!: Observable<EnqueteRecueilInterne[]>;

	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private enqueteRecueilInterneService: EnqueteRecueilInterneService,
		changeDetectorRef: ChangeDetectorRef,
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
				map((value) => typeof value === 'string' ? value : value?.titre),
				switchMap((filterText) => filterText ? this._filter(filterText) : of([]))
			);

		// Assign the observable to filteredOptions for template binding
		this.filteredOptions = filterPipeline;

		// Also subscribe to handle any side effects if needed
		this.subscription.add(
			filterPipeline.subscribe()
		);
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


	private _filter(filterText: string): Observable<EnqueteRecueilInterne[]> {
		this.setControlInvalid(); // Set invalid if filterText is too short but not empty.

		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Return empty array if the search term is too short.
		}

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		return from(this.enqueteRecueilInterneService.fetchPageByAcademieObjectId_Autocomplete(filterText, this.academieAudite_objectId, 1, 10)).pipe(
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

	displayFn(enqueteRecueilInterne?: EnqueteRecueilInterne): string {
		return enqueteRecueilInterne && enqueteRecueilInterne?.titre
			? enqueteRecueilInterne?.titre
			: '';
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: EnqueteRecueilInterne = event.option?.value;
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
