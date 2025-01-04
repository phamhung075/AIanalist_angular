import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface ProgressItem {
  icon: string;
  name: string;
  progress: number;
}

@Component({
  selector: 'app-progress-section',
  templateUrl: './progress-section.component.html',
  imports: [CommonModule],

})
export class ProgressSectionComponent implements OnInit {
  progressItems: ProgressItem[] = [
    { icon: '🌟', name: 'Formation Initiale', progress: 80 },
    { icon: '📦', name: 'Produits & Services', progress: 60 },
    { icon: '📋', name: 'Procédures Internes', progress: 40 }
  ];

  constructor() { }

  ngOnInit(): void { }
}
