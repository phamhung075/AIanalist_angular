import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-resources-section',
  imports: [CommonModule],
  templateUrl: './resources-section.component.html',
  styleUrl: './resources-section.component.scss'
})
export class ResourcesSectionComponent {
  resources = [
    {
      id: 1,
      name: 'Ressource 1',
      description: 'Description de la ressource 1',
      url: 'https://example.com/ressource1',
      type: 'PDF',
      icon: 'file-pdf'
    },
    {
      id: 2,
      name: 'Ressource 2',
      description: 'Description de la ressource 2',
      url: 'https://example.com/ressource2',
      type: 'Video',
      icon: 'video'
    },
    {
      id: 3,
      name: 'Ressource 3',
      description: 'Description de la ressource 3',
      url: 'https://example.com/ressource3',
      type: 'Audio',
      icon: 'music'
    },
    {
      id: 4,
      name: 'Ressource 4',
      description: 'Description de la ressource 4',
      url: 'https://example.com/ressource4',
      type: 'Image',
      icon: 'image'
 } ]
}
