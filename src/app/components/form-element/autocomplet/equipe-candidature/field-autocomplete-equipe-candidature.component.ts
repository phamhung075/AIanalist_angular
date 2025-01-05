import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	effect,
	ElementRef,
	Input,
	model,
	OnChanges,
	Optional,
	Renderer2,
	Self,
	SimpleChanges,
	ViewEncapsulation
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
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
	catchError,
	debounceTime,
	from,
	map,
	Observable,
	of,
	startWith,
	Subscription,
	switchMap
} from 'rxjs';
import { Contact } from '../../../models/Contact';
import { EquipeCandidature } from '../../../models/EquipeCandidature';
import { EquipeCandidatureService } from '../../../services/equipe-candidature/equipe-candidature.service';
import { SelectedContactsComponent } from '../contact-multi/selected-contacts/selected-contacts.component';
import { FormControlAutocompleteBaseDirective } from './../form-control-autocomplete-base.directive';

@Component({
	selector: 'FIELD_autocomplete--equipe-candidature',
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
		MatCardModule,
		SelectedContactsComponent
	],
	templateUrl: './field-autocomplete-equipe-candidature.component.html',
	styleUrl: './field-autocomplete-equipe-candidature.component.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldAutocompleteEquipeCandidatureComponent extends FormControlAutocompleteBaseDirective implements OnChanges{
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() fieldName: string = '';
	@Input() isRequired?: boolean = false;
	@Input() controlValue?: any;
	@Input() academieAudite_objectId?: string;
	@Input() _isEdit?: boolean = false;
	isFullScreen = model();

	photo: string = '/assets/images/no-profile.png';

	loading = false;
	filteredOptions!: Observable<EquipeCandidature[]>;
	currentEditEquipeFormateur$M = model<Partial<Contact>[] | undefined>(undefined);
	contactsDisplay$M = model<Contact[]>([]);
	constructor(
		formBuilder: FormBuilder,
		@Optional() @Self() public ngControl: NgControl | null,
		private equipeCandidatureService: EquipeCandidatureService,
		changeDetectorRef: ChangeDetectorRef,
		el: ElementRef,
		renderer: Renderer2
	) {
		super(formBuilder, el, renderer, changeDetectorRef);
		if (this.ngControl != null) {
			this.ngControl.valueAccessor = this;
		}

		effect(() => {
			console.log(`SelectedContactsComponent contactsDisplay: ${this.contactsDisplay$M()}`);
		});
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
				map((value) => typeof value === 'string' ? value : value?.labelEquipe),
				switchMap((filterText) => filterText ? this._filter(filterText) : of([]))
			);

		// Assign the observable to filteredOptions for template binding
		this.filteredOptions = filterPipeline;

		// Also subscribe to handle any side effects if needed
		this.subscription.add(
			filterPipeline.subscribe()
		);
	}

	private _filter(filterText: string): Observable<EquipeCandidature[]> {
		this.setControlInvalid(); // Set invalid if filterText is too short but not empty.

		if (filterText.length < 2) {
			this.loading = false;
			return of([]); // Return empty array if the search term is too short.
		}

		this.loading = true;
		// Assuming fetchPages returns a Promise, convert it to an Observable.
		return from(this.equipeCandidatureService.fetchPageByAcademieObjectId_Autocomplete(filterText, this.academieAudite_objectId, 1, 10)).pipe(
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

	displayFn(equipeCandidature?: EquipeCandidature): string {
		const labelEquipe = equipeCandidature?.labelEquipe
			? equipeCandidature?.labelEquipe
			: '';
		const academieAudite = equipeCandidature?.academieAudite
			? ' (' +
			equipeCandidature?.academieAudite?.denominationSociale +
			' ' +
			equipeCandidature?.academieAudite?.adresse +
			' ' +
			equipeCandidature?.academieAudite?.codePostal +
			' ' +
			equipeCandidature?.academieAudite?.ville +
			')'
			: '';
		const consultant = equipeCandidature?.consultant
			? ' (' +
			equipeCandidature?.consultant?.nom +
			' ' +
			equipeCandidature?.consultant?.prenom +
			' ' +
			equipeCandidature?.consultant?.email +
			' ' +
			equipeCandidature?.consultant?.numPortable +
			')'
			: '';
		const responsablePedagogique = equipeCandidature?.responsablePedagogique
			? ' (' +
			equipeCandidature?.responsablePedagogique?.nom +
			' ' +
			equipeCandidature?.responsablePedagogique?.prenom +
			' ' +
			equipeCandidature?.responsablePedagogique?.email +
			' ' +
			equipeCandidature?.responsablePedagogique?.numPortable +
			')'
			: '';
		const responsableHandicap = equipeCandidature?.responsableHandicap
			? ' (' +
			equipeCandidature?.responsableHandicap?.nom +
			' ' +
			equipeCandidature?.responsableHandicap?.prenom +
			' ' +
			equipeCandidature?.responsableHandicap?.email +
			' ' +
			equipeCandidature?.responsableHandicap?.numPortable +
			')'
			: '';
		const formateurs = equipeCandidature?.formateurs
			? ' (' +
			equipeCandidature?.formateurs?.nom +
			' ' +
			equipeCandidature?.formateurs?.prenom +
			' ' +
			equipeCandidature?.formateurs?.email +
			' ' +
			equipeCandidature?.formateurs?.numPortable +
			')'
			: '';

		return (
			labelEquipe +
			academieAudite +
			consultant +
			responsablePedagogique +
			responsableHandicap +
			formateurs
		);
	}

	async onOptionSelected(event: MatAutocompleteSelectedEvent): Promise<void> {
		const value: EquipeCandidature = event.option.value;
		if (!value) {
			return;
		}
		const equipeFormateur = await this.equipeCandidatureService.fetchRelation(
			value.objectId!
		);
		this.contactsDisplay$M.set(equipeFormateur);
		this.formControl?.setValue(value);
		this.valid.set(true);
		this.formControl?.markAsDirty();
		this.canClear.set(true)
		this.changeDetectorRef.detectChanges();
	}

	getErrorMessage() {
		if (this.formControl.errors?.['required']) {
			return `${this.fieldName} est requis`;
		}
		if (this.formControl?.value?.length < 2) {
			return "Le nom de l'équipe doit contenir au moins 2 caractères";
		}
		return
	}
}
