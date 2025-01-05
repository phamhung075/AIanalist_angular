import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, ElementRef, Inject, Input, model, OnInit, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { isEqual } from 'lodash';
import { PDFDocumentProxy, PdfViewerComponent, PdfViewerModule } from 'ng2-pdf-viewer';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { ToastrService } from 'ngx-toastr';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { ScreenSizeService } from './screen-size-service/screen-size-service.service';
import { DocAdministratifService } from '../../services/doc-administratif/doc-administratif.service';
import { EditStateService } from '../edit-state/edit-state.service';
import { ParseUtilsService } from '../../services/parse-utils/parse-utils.service';

@Component({
	selector: 'app-pdf-viewer',
	templateUrl: './pdf-viewer.component.html',
	styleUrl: './pdf-viewer.component.scss',
	imports: [
		CommonModule,
		MatButtonModule,
		ReactiveFormsModule,
		NgxDocViewerModule,
		PdfViewerModule,
		MatProgressSpinnerModule
	],
	standalone: true,
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatPdfViewerComponent implements OnInit {
	@ViewChild('pdfContainer') private pdfComponent!: PdfViewerComponent;
	@ViewChild('pdfDiv', { static: false, read: ElementRef })
	pdfDiv!: ElementRef;
	@Input() fitToPage = true;
	@Input() showAll = true;
	@Input() stickToPage = true;
	@Input() originalSize = false;
	@Input() renderText = true;
	autoResize = signal<boolean>(true);

	zoom = model<number>(1);
	currentDocumentUrl = model<string>("");
	isExpanded = model<boolean>(false);

	private pdfLoadedPages = new Set<number>();
	isLoaded = false;
	isVisible = false;
	destroy$ = new Subject<void>();
	private totalPages = 0;

	safeDocxUrl?: SafeResourceUrl;
	private isInitialLoad = true;
	

	constructor(
		private toastrService: ToastrService,
		private parseUtilsService: ParseUtilsService,
		@Inject(MAT_DIALOG_DATA) private data: any,
		private changeDetectorRef: ChangeDetectorRef,
		private editStateSrv: EditStateService,
		private docAdministratifSrv: DocAdministratifService,
		private sanitizer: DomSanitizer,
		public dialogRef: MatDialogRef<PdfViewerComponent>,
		private screenSizeService: ScreenSizeService,

	) {


		effect(() => {
			let newUrl = undefined;
			if (newUrl != this.currentDocumentUrl()) {
				newUrl = this.currentDocumentUrl();
				this.resetViewerState();

			}
		});
	}

	ngOnInit(): void {
		if (this.data) {
			if (this.data.zoom) {
				this.zoom.set(this.data.zoom);
			}
			if (this.data.currentDocumentUrl) {
				this.currentDocumentUrl.set(this.data.currentDocumentUrl);
			}
		}

		this.editStateSrv.isExpanded$.pipe(
			takeUntil(this.destroy$)
		).subscribe((isExpanded) => {
			if (isExpanded === false) {
				this.closeViewer();
			} else {
				this.isVisible = true;
				this.changeDetectorRef.detectChanges();
			}
		});

		this.screenSizeService.screenSize$.pipe(
			takeUntil(this.destroy$)
		).subscribe((screenSize) => {
			if (this.screenSizeService.isSmallerThan('MD')) {
				this.autoResize.set(true);
				console.log(screenSize, this.autoResize());
				this.changeDetectorRef.detectChanges();
			} else {
				this.autoResize.set(false);
				console.log(screenSize, this.autoResize());
				this.changeDetectorRef.detectChanges();
			}
		});
	}

	ngOnDestroy(): void {
		this.resetViewerState();
		this.destroy$.next();
		this.destroy$.complete();
	}

	onZoomIn() {
		this.zoom.set(+this.zoom() + 0.1);
	}

	onZoomOut() {
		this.zoom.set(+this.zoom() - 0.1);
	}

	search(stringToSearch: string) {
		this.pdfComponent.eventBus.dispatch('find', {
			query: stringToSearch,
			type: 'again',
			caseSensitive: false,
			findPrevious: undefined,
			highlightAll: true,
			phraseSearch: true,
		});
	}

	isPdf(url: string): boolean {
		return url.toLowerCase().endsWith('.pdf');
	}




	private updateSafeDocUrl() {
		const baseUrl = `https://view.officeapps.live.com/op/view.aspx?src=`;

		const newUrl = `${baseUrl}${this.currentDocumentUrl()}`;
		const sanitizedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(newUrl);

		// Only update if the URL is different
		if (!isEqual(this.safeDocxUrl, sanitizedUrl)) {
			//console.log('Updating URL to:', newUrl);
			this.safeDocxUrl = sanitizedUrl;
			this.changeDetectorRef.detectChanges();
		}
	}

	isMicrosoftDocx(): boolean {
		const url = this.currentDocumentUrl();
		const isDocx = url.toLowerCase().endsWith('.docx')
			|| url.toLowerCase().endsWith('.doc')
			|| url.toLowerCase().endsWith('.pptx')
			|| url.toLowerCase().endsWith('.ppt')
			|| url.toLowerCase().endsWith('.xlsx')
			|| url.toLowerCase().endsWith('.xls')


		if (isDocx) {
			this.updateSafeDocUrl();
			return true;
		}
		return false;
	}

	getSafeDocUrl(): SafeResourceUrl | null {
		return this.safeDocxUrl ?? null;
	}


	isImage(): boolean {
		const url = this.currentDocumentUrl();
		const isImage = url.toLowerCase().endsWith('.png') || url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg');
		if (isImage) {
			return true;
		}
		return false;
	}

	onPageRendered(event: any): void {
		// Only process if this is a new page or initial load
		if (!this.pdfLoadedPages.has(event.pageNumber) || this.isInitialLoad) {
			this.pdfLoadedPages.add(event.pageNumber);
			this.totalPages = this.pdfComponent?.pdfViewer?.pagesCount || 0;

			// Handle single page PDFs
			if (event.pageNumber === 1 && this.isInitialLoad) {
				this.scrollToTop();
			}

			// Check if all pages are loaded
			if (this.totalPages > 0 && this.pdfLoadedPages.size === this.totalPages) {
				this.isLoaded = true;
				this.isInitialLoad = false;
				this.changeDetectorRef.markForCheck();
			}
		}
	}

	private scrollToTop(): void {
		if (this.pdfDiv?.nativeElement && this.stickToPage) {
			this.pdfDiv.nativeElement.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
				inline: 'start'
			});
		}
	}

	onProgress(progress: { loaded: number; total: number }): void {
		// Only log progress once when completed
		if (this.isInitialLoad && progress.loaded === progress.total) {
			console.log('PDF loading completed:', progress);
		}
	}
	onError(error: any): void {
		console.error('PDF loading error:', error);
		this.isLoaded = false;
		this.changeDetectorRef.detectChanges();
	}

	closeViewer(): void {
		this.isVisible = false;
		this.dialogRef.close();
		this.changeDetectorRef.detectChanges();
	}

	onPdfLoad(pdf: PDFDocumentProxy): void {
		try {
			this.totalPages = pdf.numPages;
			this.pdfLoadedPages.clear();

			if (pdf.numPages === 1) {
				this.isLoaded = true;
			}

			this.changeDetectorRef.markForCheck();
		} catch (error) {
			console.error('Error processing PDF:', error);
			this.onError(error);
		}
	}

	private resetViewerState(): void {
		this.isLoaded = false;
		this.pdfLoadedPages.clear();
		this.totalPages = 0;
		this.isInitialLoad = true;
		this.changeDetectorRef.markForCheck();
	}
}
