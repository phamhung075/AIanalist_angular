import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
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
import {
	MatFormFieldModule,
} from '@angular/material/form-field';
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
import { Epreuve } from '../../../models/Epreuve';
import { EpreuveService } from '../../../services/epreuve/epreuve.service';
import { FormControlAutocompleteBaseDirective } from '../form-control-autocomplete-base.directive';

@Component({
	selector: 'FIELD_autocomplete--epreuve',
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
	templateUrl: './field-autocomplete-epreuve.component.html',
	styleUrl: '../../../scss/autocomplete.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteEpreuveComponent extends FormControlAutocompleteBaseDirective implements OnDestroy {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	@Input() disabled: boolean = false;

	loading = false;
	filteredOptions!: Observable<Epreuve[]>;

	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private epreuveService: EpreuveService,
		el: ElementRef,
		renderer: Renderer2,
		changeDetectorRef: ChangeDetectorRef,

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



	private _filter(filterText: string): Observable<Epreuve[]> {
		// Directly start with checking the filterText length and fetching data if valid.
		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Immediately return an empty array if the search term is too short.
		}

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		return from(this.epreuveService.fetchPage(filterText, 1, 10)).pipe(
			map((response) => {
				this.loading = false;
				return response.data ?? []; // Return an empty array if data is undefined
			}),
			catchError((error) => {
				console.error(error);
				this.loading = false;
				return of([]); // On error, return an empty array.
			})
		);
	}
	displayFn(epreuve?: Epreuve): string {
		return epreuve && epreuve.titre
			? epreuve.titre
			: '';
	}

	onOptionSelected(event: MatAutocompleteSelectedEvent): void {
		const value: Epreuve = event.option.value;
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
