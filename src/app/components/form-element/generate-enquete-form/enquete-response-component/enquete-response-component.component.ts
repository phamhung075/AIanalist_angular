import { EnqueteResponseService } from './../../../services/enquete-response/enquete-response.service';
import { EnqueteForm, EnqueteResponse } from './../../../models/EnqueteRecueil';
import { ParseUtilsAbstract } from '../../../services/parse-utils/parse-utils.abstract';
import { Contact } from './../../../models/Contact';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, OnInit, Optional, ViewEncapsulation, computed, model } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { isEmpty, isEqual } from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { switchMap } from 'rxjs';

@Component({
	selector: 'app-enquete-response',
	templateUrl: './enquete-response-component.component.html',
	styleUrls: ['./enquete-response-component.component.scss'],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		MatSliderModule,
		MatIconModule,
		MatButtonModule,
	],
	standalone: true,
	providers: [

	],
	encapsulation: ViewEncapsulation.Emulated,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnqueteResponseComponent extends ParseUtilsAbstract implements OnInit {
	@Input() _testView?: boolean = false;
	questions$M = model<string | undefined>(undefined);
	titre$M = model<string>('');
	description$M = model<string>('');
	review$M = model<boolean>(true);
	isNew$M = model<boolean>(true);
	contactResponse$M = model<Contact>();
	enqueteForm$M = model<EnqueteForm>();
	enqueteRecueilInterne_objectId$M = model<string>();
	enqueteResponse_objectId$M = model<string>();
	enqueteResponse$M = model<any>({});

	postData$M = model<any>({});

	enqueteResponseData$S = toSignal(
		toObservable(this.enqueteRecueilInterne_objectId$M).pipe(
			switchMap(async (enqueteRecueilInterne_objectId) => {
				//console.log('enqueteRecueilInterne_objectId', enqueteRecueilInterne_objectId);
        if (!isEqual(this.enqueteResponse$M(), {})){
          //console.log('enqueteResponse$M--------->', this.enqueteResponse$M());
          this.formData = !isEmpty(this.enqueteResponse$M()) ? this.enqueteResponse$M() : {};

          return this.enqueteResponse$M()

        } else {

          if (enqueteRecueilInterne_objectId) {
            const responseData = await this.enqueteResponseService.getEnqueteResponseByEnqueteRecueilInterne(enqueteRecueilInterne_objectId) as EnqueteResponse;
            const response = JSON.parse(responseData.response!)
            //console.log('response', response);
            this.enqueteResponse_objectId$M.set(responseData.objectId);
            this.formData = !isEmpty(response) ? response : {};
            this.changeDetectorRef.detectChanges();
            return response.response;
          } else this.initializeFormData();
          return {};
        }



			})
		)
	);

	questions$S = computed(() => {
		if (this.questions$M() === undefined) {
			return [];
		}
		return JSON.parse(this.questions$M() as string);
	});

	formData: any = {};

	constructor(
		private toastrService: ToastrService,
		@Inject(MAT_DIALOG_DATA) public data: any,
		@Optional() private dialogRef: MatDialogRef<any>,
		private enqueteResponseService: EnqueteResponseService,
		changeDetectorRef: ChangeDetectorRef,
	) {
		super(changeDetectorRef);
	}

	async ngOnInit(): Promise<void> {
		this.initializeFormData();
		//console.log('ngOnInit - data:', this.data); // Debugging log to verify received data format
		if (!isEmpty(this.data)) {
			this.review$M.set(this.data.review === undefined ? true : this.data.review);
			this.isNew$M.set(this.data.isNew === undefined ? true : this.data.isNew);

			if (this.data.titre) this.titre$M.set(this.data.titre);
			if (this.data.description) this.description$M.set(this.data.description);
			if (this.data.response) {
				this.formData = { ...this.data.response };
			}
			if (this.data.contactResponse) this.contactResponse$M.set(this.data.contactResponse);
			if (this.data.enqueteForm) this.enqueteForm$M.set(this.data.enqueteForm);
			if (this.data.enqueteRecueilInterne_objectId) this.enqueteRecueilInterne_objectId$M.set(this.data.enqueteRecueilInterne_objectId);
			if (this.data.enqueteResponse_objectId) this.enqueteResponse_objectId$M.set(this.data.enqueteResponse_objectId);

			if (this.data._testView) this._testView = this.data._testView;

			this.questions$M.set(this.data.questions);

			this.changeDetectorRef.detectChanges();
		}
	}

	initializeFormData() {
		this.formData = {};
	}

	onSliderChange(value: any, controlName: string) {
		this.formData[controlName] = value;
		this.changeDetectorRef.detectChanges();
	}

	async onSubmit(formData: any) {
		//console.log('formData:', formData); // Debugging log to verify formData format
		const enqueteResponse = await this.enqueteResponseService.getEnqueteResponseByEnqueteRecueilInterne(this.enqueteRecueilInterne_objectId$M()!);
		if (enqueteResponse) {
			this.isNew$M.set(false);
			this.toastrService.info("Mise à jour");
		}
		else {
			this.isNew$M.set(true);
		}

		if (this.isNew$M()) {
			this.postData$M.set({
        response: JSON.stringify(this.formData),
				contact: this.contactResponse$M(),
				enqueteForm: this.enqueteForm$M(),
				enqueteRecueilInterne_objectId: this.enqueteRecueilInterne_objectId$M(),
			});
			//console.log("postData:", this.postData$M());
			const result = await this.enqueteResponseService.create(this.postData$M());
			if (result) this.toastrService.success("Enregistrement réussi");
			else this.toastrService.error("Enregistrement échoué");
		}
		else {
			this.postData$M.set({
				objectId: this.enqueteResponse_objectId$M(),
				response: JSON.stringify(this.formData),
			});
			//console.log("postData:", this.postData$M());

			const result = await this.enqueteResponseService.update(this.postData$M());
			if (result) this.toastrService.success("Mise à jour réussi");
			else this.toastrService.error("Mise à jour échoué");
		}
	}

	formatLabel(value: number): string {
		if (value >= 1000) {
			return Math.round(value / 1000) + 'k';
		}
		return `${value}`;
	}
}

