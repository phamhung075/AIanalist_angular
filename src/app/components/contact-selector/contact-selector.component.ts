import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../services/contact-service/contact.service';

@Component({
  selector: 'app-contact-selector',
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-selector.component.html',
  styleUrl: './contact-selector.component.scss'
})
export class ContactSelectorComponent {
  @Input() contacts: Contact[] = [];
  @Output() contactSelected = new EventEmitter<Contact>();

  searchTerm = '';
  filteredContacts: Contact[] = [];
  selectedContact: Contact | null = null;

  ngOnInit() {
    this.filteredContacts = this.contacts;
  }

  ngOnChanges() {
    this.filterContacts();
  }

  filterContacts() {
    const search = this.searchTerm.toLowerCase();
    this.filteredContacts = this.contacts.filter(contact => {
      return (
        contact.nom.toLowerCase().includes(search) ||
        contact.prenom.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.phone.includes(search) ||
        contact.entreprise?.denomination.toLowerCase().includes(search) ||
        contact.entreprise?.siret?.includes(search)
      );
    });
  }

  selectContact(contact: Contact) {
    this.selectedContact = contact;
    this.contactSelected.emit(contact);
  }
}
