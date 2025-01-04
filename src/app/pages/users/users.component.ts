import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LoadingOverlayComponent } from '../../components/loading-overlay/loading-overlay.component';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user-service/user.service';

@Component({
  selector: 'app-users',
  imports: [CommonModule, LoadingOverlayComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  paginatedUsers: User[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  error: string | null = null;
  isLoading = false;
  showStatusModal = false;
  showRoleModal = false;
  selectedUser: User | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données.';
        this.isLoading = false;
      },
    });
  }

  toggleUserStatus(user: User) {
    this.selectedUser = user;
    this.showStatusModal = true;
  }

  toggleUserRole(user: User) {
    this.selectedUser = user;
    this.showRoleModal = true;
  }

  confirmStatusChange() {
    let user = this.selectedUser;
    if (user) {
      this.userService.toggleStatus(user.id).subscribe({
        next: (data) => {
          user = this.users.find(u => u.id === user!.id)!;
          user.is_active = !user.is_active;
          this.isLoading = false;
          this.showStatusModal = false;
        },
        error: (err) => {
          this.error = 'Erreur lors de l\'actualisation';
          this.isLoading = false;
          this.showStatusModal = false;
        },
      });
    }
  }

  cancelStatusChange() {
    this.selectedUser = null;
    this.showStatusModal = false;
  }

  confirmRoleChange() {
    let user = this.selectedUser;
    if (user) {
      this.userService.toggleRole(user.id).subscribe({
        next: (data) => {
          user = this.users.find(u => u.id === user!.id)!;
          user.role = user.role == 'user' ? 'admin' : 'user';
          this.isLoading = false;
          this.showRoleModal = false;
        },
        error: (err) => {
          this.error = 'Erreur lors de l\'actualisation';
          this.isLoading = false;
          this.showRoleModal = false;
        },
      });
    }
  }

  cancelRoleChange() {
    this.selectedUser = null;
    this.showRoleModal = false;
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.users.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  getTotalPages(): number {
    return Math.ceil(this.users.length / this.itemsPerPage);
  }

  getNumberResults(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.users.length);
  }

}
