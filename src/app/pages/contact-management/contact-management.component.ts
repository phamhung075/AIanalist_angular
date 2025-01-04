import { CommonModule } from '@angular/common';
import { Component, computed, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CreateContactDto, Contact, ContactService } from '../../services/contact-service/contact.service';
import { CreateEntrepriseDto, Entreprise, EntrepriseService } from '../../services/entreprise-service/entreprise.service';

@Component({
  selector: 'app-contact-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact-management.component.html'
})
export class ContactManagementComponent {
  // États des modals
  showNewEntrepriseModal = false;
  showNewContactModal = false;

  // État pour l'entreprise sélectionnée
  selectedEntrepriseId = signal<string | null>(null);
  searchTerm = signal<string>('');

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;
  currentPageContact = 1;
  itemsPerPageContact = 5;
  totalPages = computed(() => Math.ceil(this.entreprises().length / this.itemsPerPage));
  totalPagesContact = computed(() => Math.ceil(this.filteredContacts().length / this.itemsPerPageContact));

  isEditingEntreprise = signal<boolean>(false);
  isEditingContact = signal<boolean>(false);
  editingEntrepriseId = signal<string | null>(null);
  editingContactId = signal<string | null>(null);
  showDeleteModal = signal<boolean>(false);
  deleteType = signal<'entreprise' | 'contact' | null>(null);
  deleteItemId = signal<string | null>(null);

  selectedType = signal<string | null>(null);

  // Formulaires
  entrepriseForm: CreateEntrepriseDto = {
    denomination: '',
    siret: '',
    type: ''
  };

  contactForm: CreateContactDto = {
    entreprise_id: '',
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    type: ''
  };

  // Resources
  entrepriseResource = resource<Entreprise[], unknown>({
    loader: () => {
      // On utilise le selectedType directement dans le loader
      const params = new URLSearchParams();
      if (this.selectedType()) {
        params.append('type', this.selectedType()!);
      }
      return firstValueFrom(this.entrepriseService.getEntreprises(params));
    }
  });

  contactResource = resource<Contact[], unknown>({
    loader: async () => {
      return firstValueFrom(this.contactService.getContacts());
    }
  });

  // Computed values
  entreprises = computed(() => this.entrepriseResource.value() ?? []);
  contacts = computed(() => this.contactResource.value() ?? []);

  // Filtres et computations
  filteredContacts = computed(() => {
    const searchLower = this.searchTerm().toLowerCase();
    return this.contacts().filter(contact => {
      if (this.selectedEntrepriseId() && contact.entreprise_id !== this.selectedEntrepriseId()) {
        return false;
      }
      if (this.searchTerm()) {
        return (
          contact.nom.toLowerCase().includes(searchLower) ||
          contact.prenom.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.phone.includes(searchLower)
        );
      }
      return true;
    });
  });

  isLoading = computed(() =>
    this.entrepriseResource.isLoading() ||
    this.contactResource.isLoading()
  );

  constructor(
    private entrepriseService: EntrepriseService,
    private contactService: ContactService
  ) { }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.entrepriseResource.reload();
    this.contactResource.reload();
  }

  updateType(type: string | null): void {
    this.selectedType.set(type);
    // Le resource se rechargera automatiquement car on a changé le selectedType
    this.entrepriseResource.reload();
  }

  // Modifier la méthode createEntreprise pour gérer l'édition
  async createEntreprise(event: Event): Promise<void> {
    event.preventDefault();
    try {
      if (this.isEditingEntreprise()) {
        await firstValueFrom(
          this.entrepriseService.updateEntreprise(
            this.editingEntrepriseId()!,
            this.entrepriseForm
          )
        );
      } else {
        const entreprise = await firstValueFrom(
          this.entrepriseService.createEntreprise(this.entrepriseForm)
        );
        this.contactForm.entreprise_id = entreprise.id;
        this.showNewContactModal = true;
      }
      this.showNewEntrepriseModal = false;
      this.loadAll();
      this.resetEntrepriseForm();
    } catch (error) {
      console.error('Error with entreprise:', error);
    }
  }

  // Modifier la méthode createContact pour gérer l'édition
  async createContact(event: Event): Promise<void> {
    event.preventDefault();
    try {
      if (this.isEditingContact()) {
        await firstValueFrom(
          this.contactService.updateContact(
            this.editingContactId()!,
            this.contactForm
          )
        );
      } else {
        await firstValueFrom(
          this.contactService.createContact(this.contactForm)
        );
      }
      this.showNewContactModal = false;
      this.loadAll();
      this.resetContactForm();
    } catch (error) {
      console.error('Error with contact:', error);
    }
  }

  // Helpers
  resetEntrepriseForm(): void {
    this.entrepriseForm = {
      denomination: '',
      siret: ''
    };
  }

  resetContactForm(): void {
    this.contactForm = {
      entreprise_id: '',
      nom: '',
      prenom: '',
      email: '',
      phone: ''
    };
  }

  getEntrepriseName(id: string): string {
    return this.entreprises().find(e => e.id === id)?.denomination || 'N/A';
  }

  selectEntreprise(id: string | null): void {
    this.selectedEntrepriseId.set(id);
  }

  updateSearch(term: string): void {
    this.searchTerm.set(term);
  }

  updatePagination(): void {
    this.currentPage = 1;
  }

  updatePaginationContact(): void {
    this.currentPageContact = 1;
  }

  openCreateEntrepriseModal(): void {
    this.entrepriseForm = {
      denomination: '',
      siret: '',
      type: 'of'
    };
    this.isEditingEntreprise.set(false);
    this.editingEntrepriseId.set(null);
    this.showNewEntrepriseModal = true;
  }

  openCreateContactModal(): void {
    this.contactForm = {
      entreprise_id: '',
      nom: '',
      prenom: '',
      email: '',
      phone: '',
      type: 'salarie'
    };
    this.isEditingContact.set(false);
    this.editingContactId.set(null);
    this.showNewContactModal = true;
  }

  openEditEntrepriseModal(entreprise: Entreprise): void {
    this.entrepriseForm = {
      denomination: entreprise.denomination,
      siret: entreprise.siret,
      type: entreprise.type
    };
    this.isEditingEntreprise.set(true);
    this.editingEntrepriseId.set(entreprise.id);
    this.showNewEntrepriseModal = true;
  }

  openEditContactModal(contact: Contact): void {
    this.contactForm = {
      entreprise_id: contact.entreprise_id,
      nom: contact.nom,
      prenom: contact.prenom,
      email: contact.email,
      phone: contact.phone,
      type: contact.type
    };
    this.isEditingContact.set(true);
    this.editingContactId.set(contact.id);
    this.showNewContactModal = true;
  }

  openDeleteModal(type: 'entreprise' | 'contact', id: string): void {
    this.deleteType.set(type);
    this.deleteItemId.set(id);
    this.showDeleteModal.set(true);
  }

  async confirmDelete(): Promise<void> {
    try {
      if (this.deleteType() === 'entreprise') {
        await firstValueFrom(
          this.entrepriseService.deleteEntreprise(this.deleteItemId()!)
        );
      } else {
        await firstValueFrom(
          this.contactService.deleteContact(this.deleteItemId()!)
        );
      }
      this.showDeleteModal.set(false);
      this.deleteType.set(null);
      this.deleteItemId.set(null);
      this.loadAll();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }
}