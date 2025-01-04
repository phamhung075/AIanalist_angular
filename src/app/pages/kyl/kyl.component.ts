import { CommonModule } from '@angular/common';
import { Component, computed, effect, OnDestroy, OnInit, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { KYL } from '../../models/kyl.model';
import { KylService } from '../../services/kyl-service/kyl.service';
import { VideoService } from '../../services/video-service/video.service';
import { firstValueFrom } from 'rxjs';
import { query } from '@angular/animations';
@Component({
  selector: 'app-kyl',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent],
  templateUrl: './kyl.component.html',
  styleUrl: './kyl.component.scss'
})
export class KylComponent implements OnInit, OnDestroy {
  itemsPerPage: number = 10;
  error: string | null = null;
  showVideoModal = false;
  currentKYL: KYL | null = null;
  videoUrl?: string;

  //modal data
  currentStep = 1;
  verificationText = '';
  documentRecto = '';
  documentVerso = '';
  documentType = '';
  selectedStatusFilter = signal<string>('all');
  currentTime = signal(new Date());
  private timeUpdateInterval: any;

  kylResource = resource<KYL[], unknown>({
    // Define a reactive request computation.
    // For now, we have no reactive dependencies, so just return null.

    // Define an async loader that retrieves data.
    // This will run every time the `request` value changes.
    loader: async () => {
      // Convert the Observable returned by getKYLs into a Promise.
      const kyls = this.kylService.getKYLs();
      return await firstValueFrom(kyls);
    }
  });

  kyls = computed<KYL[]>(() => {
    if (this.kylResource.hasValue())
      return this.kylResource.value() ?? [];
    else return []
  })

  isLoading = computed(() => this.kylResource.isLoading())
  currentPage = signal<number>(1);


  filteredKyls = computed(() => {
    const allKyls = this.kyls();
    if (this.selectedStatusFilter() === 'all') {
      return allKyls;
    }
    return allKyls.filter(kyl => kyl.status === this.selectedStatusFilter());
  });

  // Then use filtered KYLs for pagination
  startIndex = computed(() => (this.currentPage() - 1) * this.itemsPerPage);
  endIndex = computed(() => this.startIndex() + this.itemsPerPage);

  // Use filtered KYLs for pagination
  paginatedKyls = computed(() =>
    this.filteredKyls().slice(this.startIndex(), this.endIndex())
  );

  // Update getTotalPages to use filtered count
  totalPages = computed(() => Math.ceil(this.filteredKyls().length / this.itemsPerPage));
  // Update number of results to use filtered count
  numberResults = computed(() => this.filteredKyls().length);


  constructor(private kylService: KylService, private videoService: VideoService) {

  }

  ngOnInit(): void {
    this.loadKYLs();
    this.timeUpdateInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }

  loadKYLs(): void {
    this.kylResource.reload();
  }



  onPageChange(page: number): void {
    this.currentPage.set(page);
  }



  viewVideo(kyl: KYL): void {
    this.currentKYL = kyl;
    this.kylService.getKYLById(kyl.id!).subscribe({
      next: (data) => {
        this.currentKYL = data;
        const url = data.video;
        const documents = data.documents;
        const firstName = (data as any).beneficiary[0].first_name;
        const lastName = (data as any).beneficiary[0].last_name;
        const formationName = data.formation?.name;
        const formationObjectives = data.formation?.objectives;
        const formationDuration = data.formation?.duration;
        const formationStartDate = new Date(data.session_start).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-');
        const formationEndDate = new Date(data.session_end).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-'); const texttosay = `Je soussigné(e) Monsieur/Madame ${firstName} ${lastName}, certifie que les informations que je déclare sont exactes et sincères.
  Je me suis inscrit(e) à la formation intitulée ${formationName}, ayant pour objectif ${formationObjectives},
  d'une durée de ${formationDuration} heure(s), qui débute le ${formationStartDate} et se termine le ${formationEndDate}.
  Toutes les informations nécessaires à mon inscription y étaient mentionnées.`;

        if (url && documents) {
          this.videoUrl = url;
          this.showVideoModal = true;
          this.documentRecto = documents.recto.image;
          this.documentVerso = documents.verso.image;
          this.documentType = documents.recto.type;
          this.verificationText = texttosay;
        } else {
          console.error('Error fetching KYL details: no video found');
        }
      },
      error: (err) => {
        console.error('Error fetching KYL details:', err);
      }
    });
  }

  closeVideoModal(): void {
    this.showVideoModal = false;
    this.currentKYL = null;
    this.videoUrl = undefined;
    this.documentRecto = '';
    this.documentVerso = '';
    this.documentType = '';
    this.verificationText = '';
    this.currentStep = 1;
  }

  approveKYL(kyl: KYL): void {
    kyl.status = 'approved';
    this.kylService.updateKYLStatus(kyl.id!, 'approved').subscribe();
  }

  rejectKYL(kyl: KYL): void {
    kyl.status = 'rejected';
    this.kylService.updateKYLStatus(kyl.id!, 'rejected').subscribe();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs';
      case 'completed':
        return 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs';
      case 'rejected':
        return 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs';
      default:
        return 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs';
    }
  }

  getStatusName(status: string): string {
    const statuses: { [key: string]: string } = {
      approved: 'Approuvé',
      completed: 'Complété',
      pending: 'En attente',
      rejected: 'Rejeté'
    };
    return statuses[status] || 'Inconnu';
  }

  getDurationHours(kyl: any): {show: boolean, value: string, prefix: string, numberHours: number} {
    const updatedAt = kyl.updated_at;
    const dossierAt = kyl.dossier_at;
    if (dossierAt) {
      const dossierDate = new Date(dossierAt);
      const updatedDate = new Date(updatedAt);
      const diffHours = (updatedDate.getTime() - dossierDate.getTime()) / (1000 * 60 * 60);
      const prefix = kyl.status === 'approved' ? 'Durée totale' : 'Durée';
      return {show: true, value: `${Math.floor(diffHours)}h`, prefix: prefix, numberHours: diffHours};
    } else {
      return {show: false, value: '', prefix: '', numberHours: 0};
    }
  }

  nextStep() {
    this.currentStep++;
  }

  previousStep() {
    this.currentStep--;
  }

  onStatusFilterChange(status: string): void {
    this.selectedStatusFilter.set(status);
    this.currentPage.set(1); // Reset to first page
  }
  encodeURIComponent(text: string): string {
    return encodeURIComponent(text);
  }
}