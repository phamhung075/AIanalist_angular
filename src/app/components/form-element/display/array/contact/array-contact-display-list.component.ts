import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit, ViewEncapsulation, computed, input, model } from '@angular/core';
import { Contact } from '../../../../models/Contact';
import { isEmpty } from'lodash';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, switchMap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ContactService } from '../../../../services/contact/contact.service';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'array-contact-display-list',
  standalone: true,
  imports: [
	  CommonModule,
  ],
	templateUrl: './array-contact-display-list.component.html',
	styleUrl: './array-contact-display-list.component.scss',
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrayContactDisplayListComponent  implements OnInit {
	@Input() formGroup!: FormGroup;

	contacts = model<Partial<Contact>[] | undefined>([]);
	contactsLenght$S = computed(() => Array(this.contacts()).length);
	sessionFormation_objectId$S = input.required<string | undefined>();

	photo: string = "/assets/images/no-profile.png";
	

	contactInput$S = toSignal(
		toObservable(this.contacts)
			.pipe(
				distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
				switchMap(async (contacts) => {
					if (contacts && contacts.length > 0) {
						return await this.formalizer(contacts);
					}
					return [];
				})
			)
	);

	constructor(
		private contactService: ContactService,
		private toastrService: ToastrService,
		private changeDetectorRef: ChangeDetectorRef,
	) { }

	ngOnInit(): void {
	}


	async getContactValue(contact: Partial<Contact> | undefined) {
		this._handleObjectId(contact);
		if (contact!.objectId && contact) {
			contact = await this.contactService.readBeneficiaire_Formateur(contact.objectId!, this.sessionFormation_objectId$S()!) as Contact;
			if (contact) {
				this.changeDetectorRef.markForCheck();

				this._handleObjectId(contact);
			}
			else {
				console.error('Contact not found on getContactsValue mat-contact-select');
				contact = undefined;
			}
		} else {
			contact = undefined;
		}
		return contact;
	}


	async getContactValue_ObjectId(objectId: string | undefined) {
		let contact: Partial<Contact> | undefined = undefined;
		if (objectId) {
			contact = await this.contactService.read(objectId) as Contact;
			if (contact) {
				this.changeDetectorRef.markForCheck();

				this._handleObjectId(contact);
			}
			else {
				console.error('Contact not found on getContactsValue mat-contact-select');
				contact = undefined;
			}
		} else {
			contact = undefined;
		}
		return contact;
	}

	async formalizer(contacts: Partial<Contact>[] | undefined): Promise<Contact[]> {
		const elements = contacts;
		const array: Contact[] = [];

		for (const element of elements || []) {
			if (!element || !element.objectId) {
				continue; // Skip to the next iteration
			}
			const contact = await this.getContactValue(element) as Partial<Contact>;
			if (contact) {
				array.push(contact as Contact);
			} else {
				console.error('Contact not found or deleted on element: ', element);
			}
		}

		// Only update if the contacts are actually different
		if (JSON.stringify(this.contacts()) !== JSON.stringify(array)) {
			this.contacts.set(array);
		}

		return array;
	}


	public _handleObjectId(e: any) {
		if (e && e['id']) {
			e['objectId'] = e['id'];
			delete e['id'];
		}
	}

}
