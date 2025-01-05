import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-display-google-map',
  templateUrl: './display-google-map.component.html',
  styleUrl: './display-google-map.component.scss',
  imports: [
    CommonModule,

  ],
  standalone: true,
})
export class DisplayGoogleMapComponent {
  address = input<string>('');
  safeUrl = computed<SafeResourceUrl>(
    () =>
      this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://maps.google.com/maps?q=${encodeURIComponent(this.address())}&z=18&output=embed`
      )
  );

  constructor(
    private sanitizer: DomSanitizer,
  ) {}
}
