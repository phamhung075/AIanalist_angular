import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef, OnDestroy, OnInit, Renderer2, signal } from "@angular/core";
import { ControlValueAccessor, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, Subject, Subscription } from "rxjs";


export interface FilteredOption {
	options?: Observable<any[]>;
	displayText: string;
}

@Directive()
export abstract class FormControlAutocompleteBaseDirective implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {

	// @Input()
	abstract formGroup: FormGroup;
	abstract controlName: string;
	abstract fieldName: string;
	abstract isRequired?: boolean;
	// end @Input()
	public valid = signal<boolean>(true);
	abstract loading: boolean;
	abstract filteredOptions: Observable<any[]>;
	protected subscription: Subscription; // Step 2
	formControl!: FormControl; // Property to hold the form control
	canClear = signal<boolean>(false)
	protected destroy$ = new Subject<void>();

	constructor(
		//    @Optional() @Self() public ngControl: NgControl | null, need to be added in the child class
		protected formBuilder: FormBuilder,
		private el: ElementRef,
		private renderer: Renderer2,
		protected changeDetectorRef: ChangeDetectorRef,
	) {
		this.subscription = new Subscription(); // Step 1


		////// need to be added in the child class
		// super(formBuilder);
		// if (this.ngControl != null) {
		//   this.ngControl.valueAccessor = this;
		// }
	}

	// set up the form control and the filter options on inits
	async ngOnInit(): Promise<void> {
		this.initForm();
		await this.initValues();
		this.formControl = this.formGroup?.get(this.controlName) as FormControl;
		if (this.formControl.value) {
			this.canClear.set(true);
		}
		this.changeDetectorRef.detectChanges();
		this.subscription.add(this.formControl.valueChanges.subscribe(value => {
			this.canClear.set(!!value); // Set canClear to true if there's a value, false otherwise
		}));
	}

	ngAfterViewInit() {
		const panel = this.el.nativeElement.querySelector('.mat-mdc-autocomplete-panel');  //options drop list tail
		if (panel) {
			this.renderer.setStyle(panel, 'max-height', '512px');
		}
	}

	async initValues(): Promise<void> {};

	/**
	 * Initializes the form control for the autocomplete base directive.
	 * If the form control does not exist in the form group, it adds the control with the specified control name.
	 * If the control is required, it sets the Validators.required validator.
	 */
	protected initForm(): void {
		if (!this.formGroup?.get(this.controlName)) {
			this.formGroup?.addControl(
				this.controlName,
				this.formBuilder?.control('', this.isRequired ? Validators.required : null)
			);
		}
	}

	// Filter options and display functions (select and display the option in the input field)
	// need to be added in the child class
	protected abstract initFilterOptions(): void;
	//need private _filter(name: string): Observable<any[]> {} in the child class

	protected abstract displayFn(option: any): string | undefined;

	protected abstract onOptionSelected(event: any): void;
	// end Filter options and display functions


	// ControlValueAccessor Implementation
	public writeValue(obj: any): void {
		this.formGroup?.get(this.controlName)?.setValue(obj);
	}

	public registerOnChange(fn: any): void {
		const sub = this.formGroup?.get(this.controlName)?.valueChanges.subscribe(fn);
		if (sub) {
			this.subscription.add(sub); // Step 3: Store the subscription
		}
	}

	public _handleObjectId(e: any) {
		if (e && e['id']) {
			e['objectId'] = e['id'];
			delete e['id'];
		}
	}

	public isDirty(): boolean {
		return this.formGroup?.get(this.controlName)?.dirty ?? false;
	}

	public isPristine(): boolean {
		return this.formGroup?.get(this.controlName)?.pristine ?? false;
	}

	public isValid(): boolean {
		return this.formGroup?.get(this.controlName)?.valid ?? false;
	}

	public isInvalid(): boolean {
		return this.formGroup?.get(this.controlName)?.invalid ?? false;
	}


	public ngOnDestroy(): void {
		if (this.subscription) {
			this.subscription.unsubscribe(); // Step 4: Cleanup
		}
		this.destroy$.next();
		this.destroy$.complete();
		this.changeDetectorRef.detach();
	}

	public focus() {
		this.valid.set(false);
		this.formControl?.markAsTouched();
	}

	public registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	protected onTouched = () => {
		// This function will be called when the control should be marked as 'touched'.
	};

	public setDisabledState?(isDisabled: boolean): void {
		if (isDisabled) {
			this.formGroup?.get(this.controlName)?.disable();
		} else {
			this.formGroup?.get(this.controlName)?.enable();
		}
	}
	// End ControlValueAccessor Implementation

	public setControlInvalid() {
		const control = this.formGroup?.get(this.controlName);
		if (control && (!control?.valid || control?.errors)) {
			control?.setErrors({ required: true });
		}
	}

	public setControlValid() {
		const control = this.formGroup?.get(this.controlName);
		if (control) {
			control?.setErrors(null); // Clear all validation errors
		}
	}

	clearInput(inputElement: HTMLInputElement): void {
		inputElement.value = '';
		this.formControl.setValue('');
		inputElement.focus();
		this.canClear.set(false);
		this.valid.set(false);

	}
}
