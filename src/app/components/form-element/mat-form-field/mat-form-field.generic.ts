import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	OnInit,
	Renderer2,
	ViewEncapsulation,
	model
} from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Cloud } from 'parse';
import { Observable, Subscription, catchError, debounceTime, distinctUntilChanged, first, from, map, of, startWith, switchMap, tap } from 'rxjs';
import { IFormGroupFieldItem } from '../../models/_generic/form-group-field-item.interface';

@Component({
	selector: 'FIELD_generic-mat-input',
	standalone: true,
	imports: [
		CommonModule,
		MatIconModule,
		MatInputModule,
		ReactiveFormsModule,
		MatFormFieldModule,
	],
	template: `
    <div class="field-container">
      <mat-form-field
        class="w-full mx-auto animated-border-container"
        appearance="fill"
        subscriptSizing="dynamic"
        [formGroup]="formGroup"
      >
        <mat-label>{{ field.label }}</mat-label>
        @if (!field.multiline) { @if (type !== "number") {

        <input
			matInput
			class="form-control"
			[attr.type]="field.type"
			[style.width.px]="field.width || '100%'"
			autocomplete="off"
			[placeholder]="field.placeholder || ''"
			[formControlName]="controlName"
			(input)="checkAndFormatValue($event)"
			(paste)="handlePaste($event)"

			#value
        />

        } @if (type === "number") {
        <input
			matInput
			class="form-control"
			type="field.type"
			[style.width.px]="field.width || '100%'"
			autocomplete="off"
			[placeholder]="field.placeholder || ''"
			[formControlName]="controlName"
			(input)="checkAndFormatValue($event)"
			#value
        />} } @if (field.multiline) {

        <textarea
			matInput
			[style.width.px]="field.width || '100%'"
			autocomplete="off"
			[placeholder]="field.placeholder || ''"
			[formControlName]="controlName"
			[rows]="field.rowCount || 5"
        >
        </textarea>
        }
      </mat-form-field>
      <a
        class="click-url"
        *ngIf="type === 'url'"
        [href]="formGroup.get(controlName)!.value"
        target="_blank"
        rel="noopener noreferrer"
        disabled="false"
      >
        <mat-icon>open_in_new</mat-icon>
      </a>
    </div>
    @if ( formControl?.invalid && (formControl?.dirty || formControl?.touched)){
    <mat-error class="mt-3">
      <span class="error-message color-red">
        {{ getErrorMessage() }}
      </span>
    </mat-error>
    }	
  `,
	styleUrls: ['../../scss/field.form.scss'],
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericMatInputComponent implements OnInit, OnDestroy {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() label!: string;
	@Input() type: string = 'text';
	@Input() multiline?: boolean = false;
	@Input() formatter?: keyof typeof GenericMatInputComponent.prototype.formatters;
	@Input() asyncValidatorName?: string;
	initialValue = model<string>('')

	emailValueChangeSub = new Subscription();
	invalid = false;
	errorMessage = '';

	private validationPatterns: { [formatter: string]: RegExp } = {
		formatSiren: /^[0-9]{3}\s[0-9]{3}\s[0-9]{3}$/,  // Espace tous les 3 chiffres 111 111 111
		formatCardNumber: /^[0-9]{4}\s[0-9]{4}\s[0-9]{4}\s[0-9]{4}$/, // Espace tous les 4 chiffres 1111 1111 1111 1111
		formatBIC: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,  // 6 lettres suivies de 2 caractères  ABCDEF 1A A89
		formatCVV: /^[0-9]{3}$/, // 3 chiffres
		formatIBAN: /^[A-Z]{2}[0-9]{2}\s([A-Z0-9]{4}\s){4}[A-Z0-9]{2}$/, // Espace tous les 4 caractères, finit par 2 caractères FR12 3456 7890 1234 5678 9012 34
		formatPhoneNumber: /^(\d{2}\s){4}\d{2}$/, // Espace tous les 2 chiffres 11 11 11 11 11
		formatPostalCode: /^[0-9]{5}$/, // 5 chiffres exactement 11111
		formatSiret: /^(\d{3}\s){3}\d{5}$/, // Espace tous les 3 chiffres 111 111 111 11111
		formatNda: /^[0-9]{11}$/, // 11 chiffres exactement 11111111111
		formatRcs: /^RCS\s+([a-zA-Z\s]+)(?:\s+([ABCD]))?\s+(\d{3}\s\d{3}\s\d{3})$/, // RCS [City] [Type or NOT] [SIREN] RCS Paris B 123 456 789
		formatApeNaf: /^[0-9]{4}[A-Z]$/, // 4 chiffres suivis d'une lettre
		formatIdcc: /^[0-9]{1,4}$/,
		formatTva: /^FR[0-9]{11}$/,
		formatUai: /^[0-9]{7}[A-Z]$/ // 7 chiffres suivis d'une lettre
	};

	formatters: { [key: string]: (event: any) => void } = {
		formatSiren: this.formatSiren,
		formatCardNumber: this.formatCardNumber,
		formatBIC: this.formatBIC,
		formatCVV: this.formatCVV,
		formatExpirationDate: this.formatExpirationDate,
		formatIBAN: this.formatIBan,
		formatPhoneNumber: this.formatPhoneNumber,
		formatPostalCode: this.formatPostalCode,
		formatSiret: this.formatSiret,
		formatNda: this.formatNda,
		formatApeNaf: this.formatApeNaf,
		formatRcs: this.formatRcs,
		formatTva: this.formatTva,
		formatUai: this.formatUai,
		formatIdcc: this.formatIdcc
	};

	field!: IFormGroupFieldItem;
	formControl: any;

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private toastrService: ToastrService,
		private renderer: Renderer2
	) { }

	async ngOnInit(): Promise<void> {
		this.field = {
			name: this.controlName,
			label: this.label,
			type: this.type,
			multiline: this.multiline,
		} as IFormGroupFieldItem;

		this.setupFormControl();
		this.applyInitialFormattingAndValidation();
		this.setupValueChangeSubscription();
		await this.applyAsyncValidator();

	}

	ngOnDestroy(): void {
		this.emailValueChangeSub.unsubscribe();
	}

	private setupFormControl(): void {
		this.formControl = this.formGroup?.get(this.controlName) as FormControl;
		if (!this.formControl) {
			console.error(`FormControl with name '${this.controlName}' not found in FormGroup.`);
			return;
		}
	}

	private setupValueChangeSubscription(): void {
		this.emailValueChangeSub.add(this.formControl.valueChanges.pipe(
			distinctUntilChanged(),
			debounceTime(700),
			startWith(this.formControl.value)
		).subscribe((value: string) => {
			if (!this.initialValue()) {
				this.initialValue.set(value);
			}
			const fakeEvent = { target: { value: value } };
			this.checkAndFormatValue(fakeEvent);
			// Assurer que la valeur est mise à jour dans la vue sans émettre de nouveaux événements
			if (fakeEvent.target.value !== value) {
				this.formControl.setValue(fakeEvent.target.value, { emitEvent: false });
			}
		}));
	}

	async applyAsyncValidator(): Promise<void> {
		if (this.formControl && this.asyncValidatorName === 'emailExists') {
			const asyncValidator = await this.emailExistsValidator();
			this.formControl.setAsyncValidators(asyncValidator);
			await this.formControl.updateValueAndValidity({ emitEvent: false, onlySelf: true });
		}
	}


	async emailExistsValidator(): Promise<AsyncValidatorFn> {
		return (control: AbstractControl): Observable<ValidationErrors | null> => {
			if (!control.value) {
				return of(null);
			}

			if (control.value?.toLowerCase() === this.initialValue()?.toLowerCase()) {
				return of(null);
			}

			if (control.value.length < 5 || !control.value.includes('@')) {
				return of(null);
			}

			return this.emailExists(control.value).pipe(
				map(exists => {
					if (exists) {
						this.toastrService.error(`L'adresse email ${control.value} existe déjà.`);
						return { emailExists: true };
					} else {
						if (control.value !== control.value?.toLowerCase()) {
							control.setValue(control.value?.toLowerCase(), { emitEvent: false });
						}
						return null;
					}
				}),
				catchError(() => of({ emailExistsFailed: true }))
			);
		};
	}



	emailExists(email: string): Observable<boolean> {
		//console.log('Checking if email exists:', email);
		//console.log('Initial value:', this.initialValue());
		return from(Cloud.run('Contact-checkEmailExists', { email })).pipe(
			map(result => result as boolean)
		);
	}

	applyInitialFormattingAndValidation(): void {
		const initialValue = this.formControl.value;
		if (initialValue && this.formatter) {
			const fakeEvent = { target: { value: initialValue } };
			this.checkAndFormatValue(fakeEvent);
			this.formControl.setValue(fakeEvent.target.value, { emitEvent: true });
		}
	}


	checkAndFormatValue(event: any): void {
		if (this.formatter) {
			const formatterFunction = this.formatters[this.formatter];
			if (formatterFunction && event) {
				formatterFunction(event);
			}
			this.validateField(event.target.value);
		}
	}

	handlePaste(event: ClipboardEvent): void {
		const pastedText = event.clipboardData?.getData('text');
		if (pastedText) {
			setTimeout(() => {
				const fakeEvent = { target: { value: pastedText } };
				this.checkAndFormatValue(fakeEvent);
				this.formControl.setValue(fakeEvent.target.value, { emitEvent: true });
			});
		}
	}

	validateField(value: string): void {
		if (this.formatter && this.validationPatterns[this.formatter]) {
			const valid = this.validationPatterns[this.formatter].test(value);
			this.formControl.setErrors(valid ? null : { invalidFormat: true });
		}
	}
	// Formatte le numéro de carte en blocs de 4 chiffres séparés par des espaces
	formatCardNumber(event: any): void {
		let input = event.target.value.replace(/\D/g, '');
		if (input.length > 16) {
			input = input.substring(0, 16); // Limite la longueur à 16 chiffres
		}
		const formatted = input.match(/.{1,4}/g)?.join(' ') ?? input;
		event.target.value = formatted;
	}

	// Formatte la date d'expiration en format MM/AA
	formatExpirationDate(event: any): void {
		let input = event.target.value.replace(/[^0-9]/g, '');
		if (input.length > 4) {
			input = input.substring(0, 4); // Limite la longueur à 4 chiffres
		}
		const formatted = input.length > 2 ? `${input.slice(0, 2)}/${input.slice(2, 4)}` : input;
		event.target.value = formatted;
	}

	// Assure que le CVV est composé de 3 chiffres maximum
	formatCVV(event: any): void {
		let input = event.target.value.replace(/\D/g, '');
		if (input.length > 3) {
			input = input.substring(0, 3); // Limite la longueur à 3 chiffres
		}
		event.target.value = input;
	}

	// Formatte le numéro de téléphone en blocs de 2 chiffres
	formatPhoneNumber(event: Event): void {
		const inputElement = event.target as HTMLInputElement;
		let input = inputElement.value.replace(/\D/g, '');
		if (input.length > 10) {
			input = input.substring(0, 10);
		}
		const formatted = input.replace(/(\d{2})(?=\d)/g, '$1 ');
		inputElement.value = formatted;
	}

	formatSiret(event: any): void {
		let input = event.target.value.replace(/\D/g, '');
		if (input.length > 14) {
			input = input.substring(0, 14); // Limite la longueur à 14 chiffres
		}
		// Regroupe les chiffres en format 3-3-3-5
		const formatted = input.match(/^(.{3})(.{3})(.{3})(.{5})$/);
		if (formatted) {
			event.target.value = `${formatted[1]} ${formatted[2]} ${formatted[3]} ${formatted[4]}`;
		} else {
			// Si la longueur ne correspond pas à 14 chiffres exactement, on garde la saisie brute pour éviter les erreurs de formatage
			event.target.value = input;
		}
	}

	// Formatte le code postal sans espaces, 5 chiffres
	formatPostalCode(event: any): void {
		let input = event.target.value.replace(/\D/g, '');
		if (input.length > 5) {
			input = input.substring(0, 5); // Limite la longueur à 5 chiffres
		}
		event.target.value = input;
	}

	// Formatte le SIREN en blocs de 3 chiffres
	formatSiren(event: any): void {
		let input = event.target.value.replace(/\D/g, '');
		if (input.length > 9) {
			input = input.substring(0, 9); // Limite la longueur à 9 chiffres
		}
		const formatted = input.match(/.{1,3}/g)?.join(' ') ?? input;
		event.target.value = formatted;
	}

	// Formatte l'UAI en 7 chiffres suivis d'une lettre
	formatUai(event: any): void {
		let input = event.target.value;
		let digits = input.replace(/\D/g, '').substring(0, 7);  // Limite à 7 chiffres
		let letterMatch = input.match(/[A-Za-z]/); // Trouve la première lettre
		let letter = letterMatch ? letterMatch[0] : ''; // Prend la première lettre trouvée

		if (letter) {
			event.target.value = `${digits}${letter}`; // Combine les chiffres et la lettre
		} else {
			event.target.value = `${digits}`; // Utilise uniquement les chiffres si aucune lettre n'est trouvée
		}
	}

	formatApeNaf(event: any): void {
		let input = event.target.value;
		let digits = input.replace(/\D/g, '').substring(0, 4);  // Limite à 7 chiffres
		let letterMatch = input.match(/[A-Za-z]/); // Trouve la première lettre
		let letter = letterMatch ? letterMatch[0] : ''; // Prend la première lettre trouvée

		if (letter) {
			event.target.value = `${digits}${letter}`; // Combine les chiffres et la lettre
		} else {
			event.target.value = `${digits}`; // Utilise uniquement les chiffres si aucune lettre n'est trouvée
		}
	}

	// Assure que l'IDCC est composé de jusqu'à 4 chiffres
	formatIdcc(event: any): void {
		let input = event.target.value.replace(/\D/g, ''); // Supprime tout ce qui n'est pas un chiffre
		input = input.substring(0, 4); // Limite à 4 chiffres
		event.target.value = input; // Met à jour la valeur de l'input
	}

	formatRcs(event: any): void {
		const prefix = 'RCS';  // Constant prefix for the RCS format
		let input = event.target.value.trim();

		// Ensure the input starts with "RCS"
		if (!input.startsWith(prefix)) {
			input = `${input.replace(/\s*/, 'RCS ')}`;
			event.target.value = input;
		}

		// Regular expression to match the input with the format "RCS [City] [Type] [SIREN]" or "RCS [City] [SIREN]"
		const regex = /^RCS\s*([a-zA-Z\s]+)\s*(?:[ABCD]\s+)?(\d{9})$/;
		const match = input.match(regex);

		if (match) {
			const city = match[1].trim();
			const siren = match[2];

			// Format the SIREN number into blocks of three digits, only if it has exactly 9 digits
			let formattedSiren = siren;
			if (siren.length === 9) {
				formattedSiren = siren.match(/.{1,3}/g).join(' ');
			}

			// Reconstruct the full RCS number including the prefix
			event.target.value = `${prefix} ${city} ${formattedSiren}`;
		} else {
			// If input does not match, log an error or handle it appropriately
			console.log("Invalid RCS format. Please follow 'RCS [City] [Type] [SIREN]' or 'RCS [City] [SIREN]' format.");
			// Optionally clear the input or provide feedback for correction
			// event.target.value = '';
		}
	}






	// Formatte le numéro NDA sans format spécial, 11 chiffres
	formatNda(event: any): void {
		let input = event.target.value.replace(/\D/g, '');
		if (input.length > 11) {
			input = input.substring(0, 11); // Limite la longueur à 11 chiffres
		}
		event.target.value = input;
	}

	// Formatte le numéro de TVA avec le préfixe 'FR' suivi de 11 chiffres
	formatTva(event: any): void {
		let prefix = 'FR';
		let numbers = event.target.value.slice(2).replace(/\D/g, '');
		if (numbers.length > 11) {
			numbers = numbers.substring(0, 11); // Limite la longueur à 11 chiffres
		}
		event.target.value = `${prefix}${numbers}`;
	}

	// Formatte l'IBAN en blocs de 4 caractères
	formatIBan(event: any): void {
		let input = event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
		if (input.length > 27) {
			input = input.substring(0, 27); // Limite la longueur à 27 caractères
		}
		const formatted = input.match(/.{1,4}/g)?.join(' ') ?? input;
		event.target.value = formatted;
	}

	// Formatte le BIC en une suite de 11 caractères
	formatBIC(event: any): void {
		let input = event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
		if (input.length > 11) {
			input = input.substring(0, 11); // Limite la longueur à 11 caractères
		}
		event.target.value = input;
	}

	getErrorMessage(): string {
		const errors = this.formControl.errors;
		if (errors?.required) {
			return `${this.label} est requis`;
		} else if (errors?.invalidFormat) {
			return `Format invalide pour ${this.label}. ${this.getFormatHelpMessage()}`;
		} else if (errors?.emailExists) {
			return `L'email ${this.formControl.value} existe déjà.`;
		} else if (errors?.emailExistsFailed) {
			return `La vérification de l'email a échoué, veuillez réessayer.`;
		}
		return 'Champ invalide';
	}

	getFormatHelpMessage(): string {
		if (this.asyncValidatorName) {
			switch (this.asyncValidatorName) {
				case 'emailExists':
					return 'Cet email existe déjà dans nos données';
				default:
					return '';
			}
		}
		if (this.formatter) {
			switch (this.formatter) {
				case 'formatSiren':
					return 'Veuillez entrer un numéro SIREN en blocs de 3 chiffres (ex. 123 456 789).';
				case 'formatCardNumber':
					return 'Veuillez entrer un numéro de carte en blocs de 4 chiffres (ex. 1234 5678 9123 4567).';
				case 'formatBIC':
					return 'Veuillez entrer un code BIC de 8 ou 11 caractères (ex. ABCDEF1A A89).';
				case 'formatCVV':
					return 'Veuillez entrer un code CVV à 3 chiffres.';
				case 'formatIBAN':
					return 'Veuillez entrer un IBAN en blocs de 4 caractères (ex. FR12 3456 7890 1234 5678 9012 34).';
				case 'formatPhoneNumber':
					return 'Veuillez entrer un numéro de téléphone en blocs de 2 chiffres (ex. 01 23 45 67 89).';
				case 'formatPostalCode':
					return 'Veuillez entrer un code postal à 5 chiffres (ex. 75001).';
				case 'formatSiret':
					return 'Veuillez entrer un numéro SIRET en blocs (ex. 123 456 789 12345).';
				case 'formatNda':
					return 'Veuillez entrer un numéro NDA à 11 chiffres.';
				case 'formatRcs':
					return 'Veuillez entrer un numéro RCS au format (ex. "RCS Paris B 123 456 789"  ou  "RCS Marseille 123 456 789").';
				case 'formatApeNaf':
					return 'Veuillez entrer un code APE/NAF de 4 chiffres suivis d’une lettre (ex. 1234A).';
				case 'formatUai':
					return 'Veuillez entrer un code UAI de 7 chiffres suivis d’une lettre (ex. 1234567A).';
				case 'formatIdcc':
					return 'Veuillez entrer un numéro IDCC de 1 à 4 chiffres.';
				case 'formatTva':
					return 'Veuillez entrer un numéro de TVA (ex. FR12345678901).';
				default:
					return '';
			}
		}
		return '';
	}
}
