import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tasks-section',
  imports: [CommonModule],
  templateUrl: './tasks-section.component.html',
  styleUrl: './tasks-section.component.scss'
})
export class TasksSectionComponent {
  tasks = [
    {
      id: 1,
      name: 'Réunion avec le client',
      description: 'Discuter de la stratégie de marketing pour le prochain trimestre.',
      dueDate: '2023-07-15',
      status: 'En cours',
      icon: 'calendar'
    },
    {
      id: 2,
      name: 'Réunion avec le client',
      description: 'Discuter de la stratégie de marketing pour le prochain trimestre.',
      dueDate: '2023-07-15',
      status: 'En cours',
      icon: 'calendar'
    },
    {
      id: 3,

      name: 'Réunion avec le client',
      description: 'Discuter de la stratégie de marketing pour le prochain trimestre.',
      dueDate: '2023-07-15',
      status: 'En cours',
      icon: 'calendar'
    },
    {
      id: 4,

      name: 'Réunion avec le client',
      description: 'Discuter de la stratégie de marketing pour le prochain trimestre.',
      dueDate: '2023-07-15',
      status:  'En cours',
      icon: 'calendar'
    }
  ]
}
