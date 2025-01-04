import { CommonModule } from '@angular/common';
import { Component, computed, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Commercial, CommercialService } from '../../services/commercial-service/commercial.service';
import { Contact, ContactService } from '../../services/contact-service/contact.service';
import { ContactSelectorComponent } from '../../components/contact-selector/contact-selector.component';

interface CommercialFilters {
  status: string | null;
  search: string;
  entrepriseType: string | null; // Ajout du type d'entreprise
}

@Component({
  selector: 'app-commercial',
  standalone: true,
  imports: [CommonModule, FormsModule, ContactSelectorComponent],
  templateUrl: './commercial.component.html'
})
export class CommercialComponent {
  itemsPerPage = 10;
  error: string | null = null;
  currentPage = signal<number>(1);
  filters = signal<CommercialFilters>({
    status: null,
    search: '',
    entrepriseType: null
  });

  // Modals
  showNewCommercialModal = false;
  showAddCallModal = false;
  showEditCommentModal = false;

  // Selection state
  selectedCommercialId: string | null = null;
  selectedCallIndex: number | null = null;

  // Forms
  newCommercialForm = {
    contact_id: ''
  };

  newCallForm = {
    status: 'pas_repondu' as 'pas_repondu' | 'pas_interesse' | 'a_rappeler' | 'rdv_pris',
    commentaire: '',
    date_rdv: null as string | null
  };

  editCommentForm = {
    commentaire: ''
  };

  commercialResource = resource<Commercial[], unknown>({
    loader: async () => {
      return firstValueFrom(
        this.commercialService.getCommerciaux(this.filters().entrepriseType)
      );
    }
  });

  contactResource = resource<Contact[], unknown>({
    loader: async () => {
      return firstValueFrom(this.contactService.getContacts());
    }
  });

  // Computed values
  commerciaux = computed(() => this.commercialResource.value() ?? []);
  contacts = computed(() => this.contactResource.value() ?? []);

  // On ne veut afficher que les contacts qui ne sont pas déjà des commerciaux
  availableContacts = computed(() => {
    const commerciauxContactIds = new Set(this.commerciaux().map(c => c.contact_id));
    return this.contacts().filter(contact => !commerciauxContactIds.has(contact.id));
  });

  filteredCommerciaux = computed(() => {
    return this.commerciaux().filter(commercial => {
      const filters = this.filters();
      const searchLower = filters.search.toLowerCase();
      const contact = commercial.contact;

      // Filtre par statut
      if (filters.status && commercial.last_call?.status !== filters.status) {
        return false;
      }

      // Filtre par type d'entreprise
      if (filters.entrepriseType && contact?.entreprise?.type !== filters.entrepriseType) {
        return false;
      }

      // Filtre par recherche
      if (filters.search && contact) {
        return (
          contact.nom.toLowerCase().includes(searchLower) ||
          contact.prenom.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.phone.includes(searchLower) ||
          contact.entreprise?.denomination.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  });

  // Pagination
  startIndex = computed(() => (this.currentPage() - 1) * this.itemsPerPage);
  endIndex = computed(() => Math.min(this.startIndex() + this.itemsPerPage, this.filteredCommerciaux().length));

  paginatedCommerciaux = computed(() =>
    this.filteredCommerciaux().slice(this.startIndex(), this.endIndex())
  );

  totalPages = computed(() => Math.ceil(this.filteredCommerciaux().length / this.itemsPerPage));

  isLoading = computed(() =>
    this.commercialResource.isLoading() ||
    this.contactResource.isLoading()
  );

  constructor(
    private commercialService: CommercialService,
    private contactService: ContactService
  ) { }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.commercialResource.reload();
    this.contactResource.reload();
  }

  // Méthodes utilitaires
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'rdv_pris':
        return 'px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800';
      case 'a_rappeler':
        return 'px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
      case 'pas_interesse':
        return 'px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800';
      case 'pas_repondu':
        return 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
      default:
        return 'px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
    }
  }

  getStatusName(status: string): string {
    const statuses: { [key: string]: string } = {
      rdv_pris: 'RDV pris',
      a_rappeler: 'À rappeler',
      pas_interesse: 'Pas intéressé',
      pas_repondu: 'Pas répondu'
    };
    return statuses[status] || status;
  }

  onContactSelected(contact: Contact): void {
    this.newCommercialForm.contact_id = contact.id;
  }

  // Actions
  async createCommercial(event: Event): Promise<void> {
    event.preventDefault();
    try {
      await firstValueFrom(
        this.commercialService.createCommercial({
          contact_id: this.newCommercialForm.contact_id
        })
      );
      this.showNewCommercialModal = false;
      this.loadAll();
      this.resetForms();
    } catch (error) {
      console.error('Error creating commercial:', error);
      this.error = 'Erreur lors de la création du commercial';
    }
  }

  async addCall(commercial: Commercial): Promise<void> {
    this.selectedCommercialId = commercial.id;
    this.showAddCallModal = true;
  }

  async submitNewCall(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.selectedCommercialId) return;

    try {
      await firstValueFrom(
        this.commercialService.addCall({
          commercialId: this.selectedCommercialId,
          status: this.newCallForm.status,
          commentaire: this.newCallForm.commentaire,
          date_rdv: this.newCallForm.date_rdv!
        })
      );
      this.closeModals();
      this.loadAll();
    } catch (error) {
      console.error('Error adding call:', error);
      this.error = 'Erreur lors de l\'ajout de l\'appel';
    }
  }

  editComment(commercial: Commercial, callIndex: number): void {
    this.selectedCommercialId = commercial.id;
    this.selectedCallIndex = callIndex;
    this.editCommentForm.commentaire = commercial.historique_appel[callIndex].commentaire;
    this.showEditCommentModal = true;
  }

  async submitEditComment(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.selectedCommercialId || this.selectedCallIndex === null) return;

    try {
      await firstValueFrom(
        this.commercialService.updateCallComment({
          commercialId: this.selectedCommercialId,
          callIndex: this.selectedCallIndex,
          newCommentaire: this.editCommentForm.commentaire
        })
      );
      this.closeModals();
      this.loadAll();
    } catch (error) {
      console.error('Error updating comment:', error);
      this.error = 'Erreur lors de la mise à jour du commentaire';
    }
  }

  // Gestion des modals et formulaires
  closeModals(): void {
    this.showNewCommercialModal = false;
    this.showAddCallModal = false;
    this.showEditCommentModal = false;
    this.selectedCommercialId = null;
    this.selectedCallIndex = null;
    this.resetForms();
  }

  resetForms(): void {
    this.newCommercialForm = { contact_id: '' };
    this.newCallForm = { status: 'pas_repondu', commentaire: '', date_rdv: null };
    this.editCommentForm = { commentaire: '' };
  }

  updateFilters(
    status: string | null = null,
    search: string | null = null,
    entrepriseType: string | null = null
  ): void {
    const currentFilters = this.filters();
    this.filters.set({
      status: status ?? currentFilters.status,
      search: search ?? currentFilters.search,
      entrepriseType: entrepriseType !== undefined ? entrepriseType : currentFilters.entrepriseType
    });
    this.currentPage.set(1);
    this.loadAll(); // Ajout de cette ligne pour recharger les données
  }
}