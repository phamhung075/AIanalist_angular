import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfilService } from '../../services/profil-service/profil.service';
import { Profil } from '../../services/profil-service/profile.interface';

@Component({
  selector: 'app-profil',
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss',
})
export class ProfilComponent implements OnInit {
  profil: Profil = {
    email: '',
    firstname: '',
    lastname: '',
    company_name: '',
    address: '',
    siret: '',
    notification: false,
    phone: '',
  };
  backupProfil: Profil = {
    email: '',
    firstname: '',
    lastname: '',
    company_name: '',
    address: '',
    siret: '',
    notification: false,
    phone: '',
  };
  showPasswordFields: boolean = false;
  newPassword: string = '';
  lastPassword: string = '';
  confirmPassword: string = '';

  constructor(private profilService: ProfilService) {}

  async ngOnInit(): Promise<void> {
    this.profilService.getProfil().subscribe((profil) => {
      this.profil = profil;
      this.backupProfil = profil;
    });
  }

  updateProfil() {
    this.profilService.updateProfil(this.profil).subscribe({
      next: (profil) => {
        this.backupProfil = profil;
      },
      error: () => {
        this.profil = {
          ...this.backupProfil,
        };
      },
    });
  }

  switchNotificationState() {
    this.profilService.switchNotificationState().subscribe({
      next: (notification) => {
        // this.profil.notification = notification;
      },
      error: () => {
        this.profil.notification = !this.profil.notification;
      },
    });
  }

  changePassword(): void {
    if (
      this.newPassword &&
      this.confirmPassword &&
      this.newPassword === this.confirmPassword
    ) {
      this.profilService
        .updatePassword(this.lastPassword, this.newPassword)
        .subscribe({
          next: () => {
            this.showPasswordFields = false;
            this.newPassword = '';
            this.confirmPassword = '';
            this.lastPassword = '';
          },
          error: () => {
            // Handle error
          },
        });
    }
  }
}
