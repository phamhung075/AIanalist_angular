import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { IFormGroupFieldItem } from '../../models/_generic/form-group-field-item.interface';
import { IOption } from '../../models/_generic/options.interface';

@Component({
  selector: 'FIELD_generic-mat-select',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatFormFieldModule,
  ],
  template: `
    <mat-form-field
      class="w-full mx-auto"
      appearance="fill"
      subscriptSizing="dynamic"
      [formGroup]="formGroup"
    >
      <mat-label>{{ field.label }}</mat-label>

      @if (!field.multiline) {

      <mat-select
        class="form-control"
        autocomplete="off"
        [formControlName]="controlName"
      >
        @for (opt of field.options; track opt) {
        <mat-option class="border border-t p-4" [value]="opt.key">{{
          opt.label
        }}</mat-option>
        }
      </mat-select>
      } @if (field.multiline) {
      <mat-select
        class="form-control"
        autocomplete="off"
        [formControlName]="controlName"
        multiple
      >
        @for (opt of field.options; track opt) {
        <mat-option class="border border-t p-4" [value]="opt.key">{{
          opt.label
        }}</mat-option>
        }
      </mat-select>
      }
    </mat-form-field>
    @if ( formControl?.invalid && (formControl?.dirty ||
      formControl?.touched)){
      <mat-error>
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
export class GenericMatSelectComponent implements OnInit, OnDestroy {
  @Input() formGroup!: FormGroup;
  @Input() controlName!: string;
  @Input() label?: string = '';
  @Input() options?: IOption[] = [];
  @Input() type: string = 'text';
  @Input() multiple?: boolean = false;
  @Input() removeThisIfExistOther?: IOption = { key: '', label: '' };
  private subscription: Subscription = new Subscription();

  field!: IFormGroupFieldItem;
  formControl: any;

  ngOnInit(): void {
    // Input properties are available here
    this.field = {
      name: this.controlName,
      label: this.label,
      options: this.options,
      multiline: this.multiple ? true : false,
    } as IFormGroupFieldItem;
    this.formControl = this.formGroup?.get(this.controlName);
    if (this.multiple) {
      const sub = this.formGroup.get(this.controlName)?.valueChanges.subscribe((selectedOptions: any) => {
        if (this.removeThisIfExistOther && Array.isArray(selectedOptions) &&
          selectedOptions.includes(this.removeThisIfExistOther.key) && selectedOptions.length > 1) {
          this.formGroup.patchValue({
            [this.controlName]: selectedOptions.filter(option => option !== this.removeThisIfExistOther?.key)
          }, { emitEvent: false });
        }
      });
      this.subscription.add(sub);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getErrorMessage() {
    if (this.formControl?.errors?.['required']) {
      return `${this.field.label} est requis`;
    }
    // Add more error type checks as needed
    return 'Invalid field';
  }
}
