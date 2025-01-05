import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewEncapsulation, effect, input, model } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Contact } from '../../../../models/Contact';
import { FormFieldHeaderComponent } from '../form-field-header/form-field-header.component';

@Component({
	selector: 'lib-selected-contacts',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		FormFieldHeaderComponent
	],
	templateUrl: './selected-contacts.component.html',
	styleUrl: './selected-contacts.component.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedContactsComponent implements OnInit {
	@Input() formGroup!: FormGroup;
	@Input() controlName!: string;
	@Input() displayMainContact!: boolean;
	@Input() mainContactLabel!:string;  //Responsable Équipe Formateur
	@Input() maintContantHint!: string; //Responsable Équipe Formateur validera les épreuves des bénéficiaires.
	isFullScreen = model();
	contactsDisplay$M = model<Contact[]>();

	photo: string = "/assets/images/no-profile.png";
	disableDeleteContact = input.required();
	_testView = input.required();
	_isEdit = input.required();

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
	) {
		// effect(() => {
		// 	console.log(`SelectedContactsComponent contactsDisplay: ${this.contactsDisplay$M()}`);
		// 	this.changeDetectorRef.markForCheck();
		// });
	}

	ngOnInit(): void {
		// Log initial value on initialization

	}

	removeContact(index: number): void {
		const currentContacts = this.contactsDisplay$M();
		if (!currentContacts || currentContacts.length === 0) {
			return;
		}
		const updatedContacts = [...currentContacts];
		updatedContacts.splice(index, 1);
		this.contactsDisplay$M.set(updatedContacts);
		this.formGroup.get(this.controlName)?.setValue(updatedContacts);
	}
}
