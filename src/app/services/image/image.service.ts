import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class ImageService {
	constructor(private sanitizer: DomSanitizer) {}

	convertBase64ToSafeUrl(base64String: string): SafeUrl {
		if (!base64String) {
			return 'assets/images/avatar.png';
		}
		try {
			return this.sanitizer.bypassSecurityTrustUrl(base64String);
		} catch (error) {
			console.error('Error converting base64 to safe URL:', error);
			return 'assets/images/avatar.png';
		}
	}

	// Convert base64 string to Blob
	base64ToBlob(base64: string): Blob {
		try {
			const byteString = atob(base64);
			const arrayBuffer = new ArrayBuffer(byteString.length);
			const uint8Array = new Uint8Array(arrayBuffer);

			for (let i = 0; i < byteString.length; i++) {
				uint8Array[i] = byteString.charCodeAt(i);
			}

			return new Blob([arrayBuffer], { type: 'image/png' });
		} catch (error) {
			console.error('Error converting base64 to Blob:', error);
			return new Blob();
		}
	}

	// Create an object URL from base64
	createObjectUrlFromBase64(base64: string): Observable<string> {
		try {
			const blob = this.base64ToBlob(base64);
			return of(URL.createObjectURL(blob));
		} catch (error) {
			console.error('Error creating object URL:', error);
			return of('');
		}
	}
}
