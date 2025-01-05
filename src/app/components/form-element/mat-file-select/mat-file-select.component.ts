import { CommonModule } from '@angular/common';
import { switchMap, takeUntil } from 'rxjs/operators';
import { EditStateService } from './../edit-state/edit-state.service';

import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	DestroyRef,
	ElementRef,
	Input,
	OnChanges,
	OnDestroy,
	OnInit,
	SimpleChanges,
	ViewChild,
	computed,
	effect,
	inject,
	input,
	model,
	signal
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { AcademieAudite } from '../../models/AcademieAudite';
import { Contact } from '../../models/Contact';
import { IFormGroupFieldItem } from '../../models/_generic/form-group-field-item.interface';
import { AuthService } from '../../services/_core/auth/auth-guard.service';
import { DocumentService } from '../../services/document/document.service';
import { ParseUtilsAbstract } from '../../services/parse-utils/parse-utils.abstract';
import { MatPdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { Document, SaveFileResult } from './../../models/Document';
import { FilenamePipe } from './file-clean-fake-path.pipe';


export class FileDisplay {
	objectId?: string;
	file?: File;
	name?: string;
	size?: number;
	uploadedUrl?: string;
	type?: string;
	status?:
		| 'not-uploaded'
		| 'idle'
		| 'uploading'
		| 'success'
		| 'delete-error'
		| 'delete-success'
		| 'deleting'
		| 'restore-error'
		| 'error';
	contactCreator?: Partial<Contact>;
	academieCreator?: AcademieAudite;
	createdAt?: Date | string;
	updatedAt?: Date | string;
	categorie?: string;
	isSigned?: boolean;
}

@Component({
	selector: 'FIELD_generic-mat-input-file',
	standalone: true,
	imports: [
		CommonModule,
		MatIconModule,
		MatInputModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatProgressBarModule,
		MatProgressSpinnerModule
	],
	templateUrl: './mat-file-select.component.html',
	styleUrls: ['./mat-file-select.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatFileSelectComponent
	extends ParseUtilsAbstract
	implements OnChanges, OnInit, OnChanges, OnDestroy {
	@Input() formGroup?: FormGroup;
	@Input() controlName?: string;
	@Input() label!: string;
	@Input() allowedTypes: string[] = [];
	@Input() _isEdit?: boolean = false;
	@Input() _testView?: boolean = false;
	@Input() needPermission?: boolean = true;
	@Input() controlValue?: any;
	@Input() candidature_objectId?: string;
	field!: IFormGroupFieldItem;

	// Access the file input with  ViewChild
	@ViewChild('fileInput') fileInput!: ElementRef;
	selectedFileIdentifiers: Set<string> = new Set();
	formGroupInit?: FormGroup;

	contactCreator?: Partial<Contact>;
	academieCreator?: AcademieAudite;
	control?: FormControl;
	@Input() piecesJointes?: Partial<Document>[];

	categorie = input.required<string>();
	currentDocumentUrl = model('')
	isRestored$M = model(false);
	isAnnuled$M = model(false);
	isExplanded$S = signal<boolean>(false);
	filesLength$S = computed(() => Array(this.filesDisplay$M()).length);
	needReLoadFile$M = model(false);
	isEdit$S = signal(false);
	private destroyRef = inject(DestroyRef);
	currentEditDocuments$M = model<Partial<Document>[] | undefined>([]);
	protected destroy$ = new Subject<void>();
	filesInput$S = toSignal(
		toObservable(this.currentEditDocuments$M)
			.pipe(switchMap(async (documents) => {
				if (documents && documents.length> 0 && documents[0]?.nomFichier == null) {
					return await this.formalizer(documents);
				}
				return [];
			})))
	filesDisplay$M = model<FileDisplay[]>([]);
	safeDocxUrl?: SafeResourceUrl;


	isAnnuledSubscription$: Subscription = new Subscription();
	fileAdd: string[] = []
	fileDelete: string[] = []

	sanitizedFileName = signal<string>('');
	constructor(
		private editStateSrv: EditStateService,
		private toastrService: ToastrService,
		private formBuilder: FormBuilder,
		private authService: AuthService,
		private documentService: DocumentService,
		private dialog: MatDialog,
		changeDetectorRef: ChangeDetectorRef
	) {
		super(changeDetectorRef);
		this.authService.getUser
			.pipe(takeUntil(this.destroy$))
			.subscribe((user) => {
				this.contactCreator = user;
			});

		effect(() => {
			//console.log("-")
			//console.log("filesLength$S", this.filesLength$S())
			//console.log("files$S", this.filesInput$S())
			//console.log("currentEditDocuments$M", this.currentEditDocuments$M())
		});

		this.isAnnuledSubscription$ = toObservable(this.isAnnuled$M).subscribe(async (isAnnuled) => {
			if (isAnnuled) {
				const isRestored = await this.restoreAndCleanFiles();
				console.log("isRestored", isRestored);
				if (isRestored) {
					this.isRestored$M.set(true);
					this.fileDelete = [];
					this.fileAdd = [];
				} else {
					this.toastrService.error('Erreur lors de la restauration des fichiers');
				}
			}
		});
	}

	ngOnDestroy(): void {
		this.isAnnuledSubscription$.unsubscribe();
		this.initialize();
		this.destroy$.next();
		this.destroy$.complete();
	}
	initialize(): void {
		this.isAnnuled$M.set(false);
		this.isRestored$M.set(false);
		this.needReLoadFile$M.set(false);
		this.fileAdd = []
		this.fileDelete = []
	}


	async ngOnInit(): Promise<void> {
		if (!this.formGroup && !this.controlName) {
			console.error('Form group and control name are required.');
			this.formGroupInit = this.formBuilder.group({
				categorie: [this.categorie() ?? '-'],
				fileType: ['-'],
				urlFichier: ['-'],
				nomFichier: ['-'],
				contactCreator: [null],
				listAcademieViewers: [[]],
				listContactViewers: [[]],
				isSigned: [],
			});
		} else {
			this.control = this.formGroup?.get(this.controlName!) as FormControl;
		}
		this.initialize();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["_isEdit"]) {
			if (this._isEdit) {
				this.isEdit$S.set(this._isEdit);
			}
		}
	}

	async getContactCreatorValue(element: Partial<Document> | undefined) {
		this._handleObjectId(element!.contactCreator);
		if (element?.contactCreator?.objectId) {
			const contactCreator = await this.documentService.readContactCreatorInfo(
				element!.objectId!,
				element!.contactCreator.objectId!,
				this.needPermission
			);
			if (contactCreator != null && element?.contactCreator) {
				element.contactCreator = contactCreator as Contact;
			}
			this.changeDetectorRef.markForCheck();
			this._handleObjectId(element!.contactCreator);
		} else {
			element!.contactCreator = undefined;
		}
	}

	async getAcademieCreatorValue(element: Partial<Document> | undefined) {
		this._handleObjectId(element!.academieCreator);
		if (element?.academieCreator?.objectId) {
			const academieCreator = await this.documentService.readAcademieCreatorInfo(
				element!.objectId!,
				element!.academieCreator.objectId!,
				this.needPermission
			);
			if (academieCreator != null && element?.academieCreator) {
				element.academieCreator = academieCreator as AcademieAudite;
			}
			this.changeDetectorRef.markForCheck();
			this._handleObjectId(element!.academieCreator);
		} else {
			element!.academieCreator = undefined;
		}
	}

	async getDocumentsValue(doc: Partial<Document> | undefined) {
		this._handleObjectId(doc);
		if (doc!.objectId && doc) {

			doc = await this.documentService.read(doc.objectId!, this.needPermission) as Document;
			if (doc) {
				this.changeDetectorRef.markForCheck();

				await this.getAcademieCreatorValue(doc);
				await this.getContactCreatorValue(doc);
				this._handleObjectId(doc);
			}
			else {
				console.error('Document not found on getDocumentsValue mat-file-select');
				doc = undefined;
			}
		} else {
			doc = undefined;
		}
		return doc;
	}

	async getDocumentsValue_ObjectId(objectId: string | undefined) {
		let doc: Partial<Document> | undefined = undefined;
		if (objectId) {
			doc = await this.documentService.read(objectId!, this.needPermission) as Document;
			if (doc && doc.objectId) {
				this.changeDetectorRef.markForCheck();

				await this.getAcademieCreatorValue(doc);
				await this.getContactCreatorValue(doc);
				this._handleObjectId(doc);
			}
			else {
				console.error('Document not found on getDocumentsValue mat-file-select');
				doc = undefined;
			}
		} else {
			doc = undefined;
		}
		return doc;
	}

	async formalizer(documents: Partial<Document>[] | undefined): Promise<FileDisplay[]> {
		if (!documents) return [];
		//console.log('formalizer with elements', elements);
		const documentIdsToRead = documents
			.map((element:Document) => element.objectId)
			.filter((objectId): objectId is string => objectId !== undefined); // Type guard to ensure the array only contains strings

		if (!documentIdsToRead.length) {
			console.error('Document not found on formalizer mat-file-select');
			return [];
		}
		console.log('readMultipleDocuments');
		const documentDatas = await this.documentService.readMultipleDocuments(documentIdsToRead, true, undefined, undefined, true) as Document[];

		if (!documentDatas) {
			console.error('Document data not found on formalizer mat-file-select');
			return [];
		}

		const array: FileDisplay[] = [];

		if (documentDatas) {
			for (let index = 0; index < documentDatas.length; index++) {
				const document = documentDatas[index];
				if (!document) {
					console.error('Document not found or deleted');
					this.removeDocumentFromPiecesJointes(index); // Updated here
					continue; // Skip to the next iteration
				}
				//console.log('formalizer with document', document);
				if (document.active)
					array.push({
						objectId: document.objectId,
						name: document.parseFile?.name,
						size: document.size,
						uploadedUrl: document.parseFile?.url,
						type: document.fileType,
						categorie: document.categorie ?? this.categorie(),
						status: document['status'] ?? 'idle',
						contactCreator: document.contactCreator,
						academieCreator: document.academieCreator,
						isSigned: document.isSigned,
						createdAt: this.formatDateCreationToInput(document),
						updatedAt: this.formatDateModificationToInput(document),
					});
			}
		}
		//console.log('formalizer with array', array);
		this.filesDisplay$M.set(array as FileDisplay[]);
		this.changeDetectorRef.detectChanges();
		return array as FileDisplay[];
	}

	private removeDocumentFromPiecesJointes(index: number): void {
		const piecesJointes = this.formGroup?.get('piecesJointes')?.value;
		if (piecesJointes) {
			if (index >= 0 && index < piecesJointes.length) {
				piecesJointes.splice(index, 1); // Remove item at the specified index
			} else {
				console.error(`Index ${index} is out of bounds for piecesJointes array`);
			}
			this.formGroup?.get('piecesJointes')?.setValue(piecesJointes);
		} else {
			console.error('Array piecesJointes not found in form group');
		}
	}


	triggerFileInput() {
		this.fileInput.nativeElement.click();
		this.changeDetectorRef.markForCheck();
	}

	updateFormControlValidators(isFileSelected: boolean): void {
		if (this.formGroup && this.controlName) {
			const control = this.formGroup.get(this.controlName);
			if (control) {
				if (isFileSelected) {
					control.setValidators([Validators.required]);
				} else {
					// Decide whether you want to clear the validators or set a different set of validators
					control.clearValidators(); // or control.setValidators([some other validators]);
				}
				control.updateValueAndValidity(); // Important to re-evaluate the control's status
			}
			this.changeDetectorRef.detectChanges();
		}
	}


	sanitizeFileName(fileName: string): string {
		const extension = fileName.split('.').pop(); // Get the file extension
		const nameWithoutExtension = fileName.slice(0, -(extension!.length + 1)); // Remove the extension from the file name
		const sanitizedFileName = nameWithoutExtension.replace(/[^a-zA-Z0-9.\-_]/g, ''); // Remove special characters
		this.sanitizedFileName.set(sanitizedFileName);
		return `${sanitizedFileName}.${extension}`; // Reattach the extension
	}



	onFilesSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const array = this.filesDisplay$M() ?? [];

		if (input.files && input.files.length) {
			const newFiles = Array.from(input.files);
			this.updateFormControlValidators(true);

			newFiles.forEach((newFile) => {
				// Sanitize and rename the file name at the beginning
				const originalFileName = newFile.name;
				const sanitizedFileName = this.sanitizeFileName(originalFileName);
				const renamedFile = new File([newFile], sanitizedFileName, { type: newFile.type });

				const fileSizeInMB = renamedFile.size / 1024 / 1024; // Convert bytes to MB
				if (fileSizeInMB > 10) {
					// Limit file size to 10MB
					this.toastrService.warning(
						`${sanitizedFileName} is too large. Maximum size is 10MB.`
					);
					return; // Skip this file
				}

				if (!this.allowedTypes.includes(renamedFile.type)) {
					this.toastrService.warning(
						`${sanitizedFileName} is not an allowed file type.`
					);
					return; // Skip this file
				}

				let typeCategory = 'other'; // Default category

				// Using MIME types for image, pdf, text, and video
				if (renamedFile.type.match('image.*')) {
					typeCategory = 'image';
				} else if (renamedFile.type === 'application/pdf') {
					typeCategory = 'pdf';
				} else if (renamedFile.type.match('text.*')) {
					typeCategory = 'text';
				} else if (renamedFile.type.match('video.*')) {
					typeCategory = 'video';
				} else {
					// Fallback to extension check for document types not covered by MIME
					const extension = renamedFile.name.split('.').pop()?.toLowerCase();

					if (extension === 'doc' || extension === 'docx') {
						// Added for Word files
						typeCategory = 'doc';
					} else if (extension === 'xls' || extension === 'xlsx') {
						// Added for Excel files
						typeCategory = 'xls';
					} else if (extension === 'ppt' || extension === 'pptx') {
						// Added for PowerPoint files
						typeCategory = 'ppt';
					}
					// Add more extension checks as needed
				}

				const fileId = `${sanitizedFileName}-${renamedFile.size}`;
				if (!this.selectedFileIdentifiers.has(fileId)) {
					array.push({
						objectId: undefined,
						file: renamedFile,
						name: sanitizedFileName,
						size: renamedFile.size,
						categorie: this.categorie(),
						type: renamedFile.type,
						isSigned: undefined,
						contactCreator: this.contactCreator,
						status: 'not-uploaded',
					});
					this.selectedFileIdentifiers.add(fileId);
					this.filesDisplay$M.set(array);
				} else {
					this.toastrService.info(`${sanitizedFileName} is already selected.`);
				}
			});
		} else {
			this.updateFormControlValidators(false);
		}
		input.value = ''; // Clear the input to allow re-selecting the same file
		this.changeDetectorRef.detectChanges();
	}


	// Utility method to trigger file input click

	getErrorMessage() {
		if (this.formGroup !== undefined && this.controlName !== undefined) {
			const formControl = this.formGroup.get(this.controlName);
			// Check if the field is required but missing.
			if (formControl?.errors?.['required']) {
				return `${this.label} is required.`;
			}

			// Check if files have been selected but not uploaded yet.
			if (
				this.filesDisplay$M()!.some(
					(file) => file.status === 'idle' || file.status === 'uploading'
				)
			) {
				// Inform the user that all selected files must be uploaded to make the form valid.
				return 'All selected files must be uploaded to proceed.';
			}

			// Check if there are any files without an uploaded URL.
			if (this.filesDisplay$M()!.some((file) => !file.uploadedUrl)) {
				return "Please complete the upload of all files to activate the 'Save' button.";
			}

			// Default error message for other validation errors.
			return 'Invalid field';
		} else {
			// No error message if the form group or control name is not defined.
			return '';
		}
	}

	async uploadAllFiles(event: MouseEvent): Promise<void> {
		if (this.filesDisplay$M()?.length === 0) {
			this.toastrService.error('No files to upload.');
			return;
		}

		// No need to reset uploadedFileUrls here since we're tracking URLs in the files array now

		for (const fileWrapper of this.filesDisplay$M()!) {
			if (fileWrapper.uploadedUrl) {
				continue; // Skip already uploaded files
			}
			fileWrapper.status = 'uploading';

			try {
				const response = await this.documentService.uploadDocument(
					fileWrapper.file!,
					fileWrapper.categorie,
					this.candidature_objectId,
				) as SaveFileResult;
				//console.log('uploadFile new url:', response?.['fileUrl']);
				//console.log('uploadFile new id:', response?.['documentId']);

				fileWrapper.uploadedUrl = response?.fileUrl; // Store the URL
				fileWrapper.objectId = response?.objectId; // Store the id
				fileWrapper.name = response?.fileName; // Store the name
				this.fileAdd.push(fileWrapper.objectId!); // Add the file to the array of files to be added to the database
				this.toastrService.success(
					`File ${fileWrapper.file!.name} uploaded successfully.`
				);
				fileWrapper.status = 'success';
			} catch (error) {
				console.error('Error uploading file:', error);
				this.toastrService.error(
					`Failed to upload file ${fileWrapper.file!.name}.`
				);
			}
		}

		// Update the form control with new URLs
		if (this.formGroup !== undefined && this.controlName !== undefined) {
			// Map each file object to keep all its properties
			const filesToPatch = this.filesDisplay$M()?.map((file) => ({
				objectId: file.objectId,
				file: file.file, // Note: Directly patching File objects might not be straightforward
				name: file.name,
				size: file.size,
				uploadedUrl: file.uploadedUrl,
				categorie: this.categorie() ?? 'undefined',
				type: file.type,
				status: file.status,
				isSigned: file.isSigned,
				contactCreator: file.contactCreator, // Assuming these are the related object references or IDs
				academieCreator: file.academieCreator,
				// Include other properties as needed
			}));

			// this.formGroup.patchValue({
			//   [this.controlName]: filesToPatch,
			// });
			this.formGroup!.get(this.controlName!)!.setValue(filesToPatch);
		}
		this.changeDetectorRef.detectChanges();
		event.stopPropagation();
	}

	async deleteFile(index: number, signedStatus?: boolean | undefined): Promise<void> {
		// Get files for the specific category
		const categoryFiles = this.filterFilesBySignedStatus(signedStatus);
		const fileToDelete = categoryFiles[index];
		
		if (!fileToDelete) {
			console.error(`File at index ${index} not found in the specified category.`);
			return;
		}
	
		// Get the complete files array
		const allFiles = this.filesDisplay$M() || [];
		
		// Find the actual index in the complete array
		const actualIndex = this.filesDisplay$M().findIndex(file => 
			file.objectId === fileToDelete.objectId && 
			file.name === fileToDelete.name && 
			file.size === fileToDelete.size
		);
	
		if (actualIndex === -1) {
			console.error('File not found in the complete array');
			return;
		}
	
		const { name, size, objectId } = fileToDelete;
		const fileId = `${name}-${size}`;
	
		this.selectedFileIdentifiers.delete(fileId);
	
		if (!objectId) {
			// Remove file from the array while preserving the structure
			allFiles.splice(actualIndex, 1);
			this.filesDisplay$M.set([...allFiles]);
			this.toastrService.info(`File ${name} removed.`);
		} else {
			try {
				const result = await this.documentService.setActive(objectId, false);
				this.fileDelete.push(objectId);
	
				if (result) {
					this.toastrService.info(`File ${name} deleted.`);
					fileToDelete.status = 'delete-success';
	
					// Remove file while maintaining category structure
					allFiles.splice(actualIndex, 1);
					this.filesDisplay$M.set([...allFiles]);
	
				} else {
					this.toastrService.error(`Failed to delete file ${name}.`);
				}
			} catch (error) {
				console.error(error);
				this.toastrService.error(`Failed to delete file ${name}.`);
				fileToDelete.status = 'delete-error';
				return;
			}
		}
	
		// Update form control
		if (this.formGroup && this.controlName) {
			const updatedFilePointers = allFiles
				.filter((file) => file.objectId)
				.map((file) => this._parseToPointerByObjId(file.objectId!, 'Document'));
	
			this.formGroup.get(this.controlName)?.setValue(updatedFilePointers, {
				emitEvent: true,
			});
		}
	
		// Reset file input
		if (this.fileInput?.nativeElement) {
			this.fileInput.nativeElement.value = '';
		}
	}


	async deleteAddedFiles(): Promise<boolean> {
		let allDeleted = true;

		// Ensure `fileAdd` is an array
		if (!Array.isArray(this.fileAdd)) {
			this.toastrService.error('deletedFiles is not an array. Error restoring files.');
			return false;
		}

		if (this.fileAdd.length === 0) {
			return true;
		}

		for (const fileId of this.fileAdd) {
			try {
				const result = await this.documentService.deleteDocumentById(fileId);
				if (result) {
					//console.log(`File ${fileId} deleted successfully.`);
				} else {
					this.toastrService.error(`Failed to delete file ${fileId}`);
					allDeleted = false;
				}
			} catch (error) {
				console.error(`Error deleting file ${fileId}:`, error);
				this.toastrService.error(`Failed to delete file ${fileId}`);
				allDeleted = false;
			}
		}

		// Clear `fileAdd` after deletion attempt
		if (allDeleted) {
			this.toastrService.info('All files added previously have been deleted.');
			const remainingFiles = this.filesDisplay$M()
				?.filter((file) => !this.fileAdd.includes(file.objectId!)) ?? [];

			this.filesDisplay$M.set(remainingFiles);
			this.fileAdd = []; // Clear the `fileAdd` array after deletion
		}

		return allDeleted;
	}


	async restoreDeletedFiles(): Promise<boolean> {
		const filesDisplay = this.filesDisplay$M() || [];
		const deletedFiles = this.fileDelete || [];

		if (!Array.isArray(deletedFiles)) {
			this.toastrService.error('deletedFiles is not an array. Error restoring files.');
			return false;
		}

		if (deletedFiles.length === 0) {
			return true;
		}

		let allRestored = true;
		const restoredFiles: FileDisplay[] = [];

		for (const objectId of deletedFiles) {
			try {
				const result = await this.documentService.setActive(objectId, true);
				const [document] = await this.documentService.readMultipleDocuments([objectId], true, undefined, undefined, true);

				if (result && document) {
					if (document.active && document.parseFile){
						restoredFiles.push({
							objectId: document.objectId,
							name: document.parseFile?.name,
							size: document.size,
							uploadedUrl: document.parseFile?.url,
							type: document.fileType,
							categorie: document.categorie,
							status: 'idle',
							contactCreator: document.contactCreator,
							academieCreator: document.academieCreator,
							isSigned: document.isSigned,
							createdAt: document.createdAt,
							updatedAt: document.updatedAt,
						});
					}
				} else {
					this.toastrService.error(`Failed to restore file ${objectId}`);
					allRestored = false;
				}
			} catch (error) {
				console.error(error);
				this.toastrService.error(`Failed to restore file ${objectId}`);
				allRestored = false;
			}
		}

		// Update files while maintaining categories
		const uniqueFiles = [...filesDisplay, ...restoredFiles].filter((file, index, self) =>
			index === self.findIndex(f => f.objectId === file.objectId)
		);
		this.filesDisplay$M.set(uniqueFiles);

		// Update form control
		if (this.formGroup && this.controlName) {
			const updatedFilePointers = uniqueFiles
				.filter((file) => file.objectId)
				.map((file) => this._parseToPointerByObjId(file.objectId!, 'Document'));

			this.formGroup.get(this.controlName)?.setValue(updatedFilePointers, {
				emitEvent: true,
			});
		}

		if (allRestored) {
			this.toastrService.info('Backup files restored successfully.');
		} else {
			this.toastrService.warning('Backup files restoration completed with some errors.');
		}

		return allRestored;
	}


	async restoreAndCleanFiles(): Promise<boolean> {
		const allRestored = await this.restoreDeletedFiles();
		//console.log('allRestored:', allRestored);
		const allDeleted = await this.deleteAddedFiles();
		//console.log('allDeleted:', allDeleted);

		return allDeleted && allRestored;
	}


	isUploadWarnNeeded(): boolean {
		// Check if any file is selected but not successfully uploaded
		return this.filesDisplay$M()?.some(
			(file) => file.status === 'not-uploaded'
		) ?? false;
	}


	isTypeIncluded(type: string, query: string): boolean {
		// Guard clause for undefined inputs
		if (!type || !query) {
			return false;
		}
	
		type = type.toLowerCase();
		query = query.toLowerCase();
	
		// Define MIME type groups
		const mimeTypes = {
			image: [
				'image/',                  // All image types (jpeg, png, gif, etc.)
				'application/dicom',       // Medical images
				'application/postscript',  // AI, EPS files
				'application/x-photoshop', // PSD
				'application/illustrator', // AI files
				'image/vnd.adobe.photoshop',
				'application/x-jps',       // JPS stereoscopic images
				'application/x-mpo',       // MPO stereoscopic images
				'application/vnd.ms-dds',  // DirectDraw Surface
			],
			
			pdf: [
				'application/pdf',
				'application/x-pdf',
				'application/acrobat',
				'application/vnd.pdf',
				'text/pdf',
				'text/x-pdf',
			],
			
			text: [
				'text/',                    // All text types
				'application/json',         // JSON files
				'application/x-httpd-php',  // PHP files
				'application/xml',          // XML files
				'application/javascript',   // JavaScript files
				'application/typescript',   // TypeScript files
				'application/x-yaml',       // YAML files
				'application/x-sh',         // Shell scripts
				'application/x-perl',       // Perl scripts
				'application/x-ruby',       // Ruby scripts
				'application/x-python',     // Python scripts
				'application/x-tex',        // TeX files
				'application/rtf',          // Rich Text Format
				'application/x-latex',      // LaTeX files
				'message/rfc822',           // Email files
				'application/markdown',     // Markdown
				'text/markdown',
				'application/x-sql',        // SQL files
			],
			
			word: [
				'application/msword',       // .doc
				'application/vnd.openxmlformats-officedocument.wordprocessingml.', // .docx
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
				'application/vnd.ms-word.', // All MS Word types
				'application/vnd.oasis.opendocument.text', // .odt
				'application/vnd.wordperfect',
				'application/x-abiword',    // AbiWord documents
				'application/x-mswrite',    // MS Write
				'application/vnd.apple.pages', // Apple Pages
				'application/vnd.ms-works', // Microsoft Works
			],
			
			spreadsheet: [
				'application/vnd.ms-excel', // .xls
				'application/vnd.openxmlformats-officedocument.spreadsheetml.', // .xlsx
				'application/vnd.oasis.opendocument.spreadsheet', // .ods
				'text/csv',                 // CSV files
				'text/tab-separated-values', // TSV files
				'application/vnd.apple.numbers', // Apple Numbers
				'application/x-quattropro', // Quattro Pro
				'application/vnd.lotus-1-2-3', // Lotus 1-2-3
				'application/x-gnumeric',   // Gnumeric
			],
			
			presentation: [
				'application/vnd.ms-powerpoint', // .ppt
				'application/vnd.openxmlformats-officedocument.presentationml.', // .pptx
				'application/vnd.oasis.opendocument.presentation', // .odp
				'application/vnd.apple.keynote', // Apple Keynote
				'application/x-kpresenter',  // KPresenter
				'application/vnd.sun.xml.impress', // StarOffice
			],
			
			video: [
				'video/',                   // All video formats
				'application/x-shockwave-flash', // Flash
				'application/x-silverlight', // Silverlight
				'application/vnd.rn-realmedia', // RealMedia
				'application/x-quicktimeplayer', // QuickTime
			],
	
			audio: [
				'audio/',                   // All audio formats
				'application/ogg',          // OGG
				'application/x-midi',       // MIDI
				'application/x-musepack',   // MusePack
				'application/x-mod',        // Module/Tracker files
			],
			
			archive: [
				'application/zip',          // ZIP
				'application/x-rar-compressed', // RAR
				'application/x-7z-compressed', // 7-Zip
				'application/x-tar',        // TAR
				'application/x-bzip2',      // BZIP2
				'application/x-gzip',       // GZIP
				'application/x-lzip',       // LZIP
				'application/x-xz',         // XZ
				'application/x-compress',   // COMPRESS
				'application/x-lzma',       // LZMA
				'application/x-lzop',       // LZOP
				'application/x-ace-compressed', // ACE
				'application/x-stuffit',    // StuffIt
				'application/x-zoo',        // ZOO
				'application/x-iso9660-image', // ISO
			],
	
			database: [
				'application/x-sqlite3',    // SQLite
				'application/x-mysql',      // MySQL
				'application/x-msaccess',   // MS Access
				'application/vnd.oracle',   // Oracle
				'application/x-postgresql', // PostgreSQL
				'application/x-mongodb',    // MongoDB
			],
	
			font: [
				'application/x-font-ttf',   // TrueType
				'application/x-font-otf',   // OpenType
				'application/font-woff',    // WOFF
				'application/font-woff2',   // WOFF2
				'application/x-font-type1', // Type1
				'application/x-font-pcf',   // PCF
				'application/x-font-snf',   // SNF
			],
	
			model: [
				'model/',                   // 3D models
				'application/x-3ds',        // 3DS
				'application/x-blender',    // Blender
				'application/x-wavefront-obj', // OBJ
				'application/x-collada+xml', // COLLADA
				'application/vnd.sketchup.skp', // SketchUp
			],
	
			executable: [
				'application/x-msdownload', // .exe
				'application/x-msdos-program', // .com
				'application/x-apple-diskimage', // .dmg
				'application/vnd.android.package-archive', // .apk
				'application/x-debian-package', // .deb
				'application/x-rpm',        // .rpm
				'application/x-msi',        // .msi
			]
		};
	
		// Handle the 'other' case
		if (query === 'other') {
			// Check if the type doesn't match any of the defined categories
			return !Object.values(mimeTypes).flat().some(mimeType => 
				type.includes(mimeType));
		}
	
		// Check if query exists in mimeTypes
		if (query in mimeTypes) {
			return mimeTypes[query as keyof typeof mimeTypes].some(mimeType => 
				type.includes(mimeType));
		}
	
		// Fallback to direct inclusion check
		return type.includes(query);
	}
	

	formatDateCreationToInput(element: Partial<Document>): string {
		if (
			typeof element.createdAt === 'string' ||
			element.createdAt instanceof Date
		) {
			return this._formatDateToRawMatInputValue(
				element.createdAt
			);
		} else {
			// Handle error or unexpected type
			console.error('createdAt is not a valid date');
			return '00-00-0000';
		}
	}
	formatDateModificationToInput(element: Partial<Document>): string {
		if (
			typeof element.updatedAt === 'string' ||
			element.updatedAt instanceof Date
		) {
			return this._formatDateToRawMatInputValue(
				element.updatedAt
			);
		} else {
			// Handle error or unexpected type
			console.error('updatedAt is not a valid date');
			return '00-00-0000';
		}
	}

	viewFile(currentDocumentUrl: string) {
		const data = {
			currentDocumentUrl: currentDocumentUrl,
			zoom: 1,
		};
		this.dialog.open(MatPdfViewerComponent, {
			autoFocus: false,
			height: '100%',
			width: '90%',
			data: data,
		});
	}

	isPdf(url: string): boolean {
		return url.toLowerCase().endsWith('.pdf');
	}

	isMicrosoftDocx(currentDocumentUrl: string): boolean {
		const url = currentDocumentUrl;
		const isDocx = url.toLowerCase().endsWith('.docx')
			|| url.toLowerCase().endsWith('.doc')
		// || url.toLowerCase().endsWith('.pptx')
		// || url.toLowerCase().endsWith('.ppt')
		// || url.toLowerCase().endsWith('.xlsx')
		// || url.toLowerCase().endsWith('.xls')


		if (isDocx) {
			return true;
		}
		return false;
	}



	isImage(currentDocumentUrl: string): boolean {
		const url = currentDocumentUrl;
		const isImage = url.toLowerCase().endsWith('.png') || url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.jpeg');
		if (isImage) {
			return true;
		}
		return false;
	}


	// Method to check if there are files with undefined isSigned status
	hasUndefinedSignedFiles(): boolean {
		const files = this.filesDisplay$M();
		if (!files) {
			return false;
		}
		return files.some(file => file.isSigned === undefined);
	}

	// Method to check if there are files with isSigned === true
	hasSignedFiles(): boolean {
		const files = this.filesDisplay$M();
		if (!files) {
			return false;
		}
		return files.some(file => file.isSigned === true);
	}

	// Method to check if there are files with isSigned === false
	hasUnsignedFiles(): boolean {
		const files = this.filesDisplay$M();
		if (!files) {
			return false;
		}
		return files.some(file => file.isSigned === false);
	}

	// Method to filter files by isSigned status

	filterFilesBySignedStatus(status: boolean | undefined): FileDisplay[] {
		const files = this.filesDisplay$M();
		if (!files) {
			return [];
		}
		// For undefined status (Documents sans état de signature), explicitly check for undefined/null
		if (status === undefined) {
			return files.filter(file => file.isSigned === undefined || file.isSigned === null);
		}
		return files.filter(file => file.isSigned === status);
	}

}
