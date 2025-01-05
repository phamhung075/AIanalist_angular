import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { EnqueteGeneratorComponentComponent } from '../enquete-generator-component/enquete-generator-component.component';
import { EnqueteResponseComponent } from '../enquete-response-component/enquete-response-component.component';
import { EnqueteReviewComponent } from '../enquete-review-component/enquete-review-component.component';
import { Contact } from './../../../models/Contact';
import { ContactService } from './../../../services/contact/contact.service';
import { EnqueteFormService } from './../../../services/enquete-form/enquete-form.service';
import { ParseUtilsService } from './../../../services/parse-utils/parse-utils.service';

@Component({
  selector: 'app-generate-enquete-form',
  templateUrl: './generate-enquete-form.component.html',
  styleUrl: './generate-enquete-form.component.scss',
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    EnqueteGeneratorComponentComponent,
    EnqueteReviewComponent,
    EnqueteResponseComponent
  ],
  standalone: true,

  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateEnqueteFormComponent {
  constructor(
    private toastrService: ToastrService,
    private parseSrv: ParseUtilsService,
    private contactService: ContactService,
    private enqueteFormService: EnqueteFormService
  ) {

  }
  questions$M = model<string>();
  enqueteTitle?: string;
  enqueteDescription?: string;
  async saveQuestions() {
    const questions = this.questions$M();
    const user = await this.contactService.readMyContact() as Contact;
    const academieAudite = user!.academieAudite!
    //console.log("academieAudite:", academieAudite);
    const academieAuditePointer = this.parseSrv._parseToPointerByObjId(academieAudite?.objectId!, "AcademieAudite")
    if (questions) {
      const parseObj = {
        titre: this.enqueteTitle,
        description: this.enqueteDescription,
        questions: JSON.stringify(questions),
        academieAudite: academieAuditePointer
      };
      //console.log("parseObj:", parseObj);

      const result = await this.enqueteFormService.create(parseObj);

      if (result) {
        this.toastrService.success("Enquête form créée avec succès");
      } else {
        this.toastrService.error("Erreur lors de la création de l'enquête form");
      }
    } else {
      this.toastrService.error("Les questions ne peuvent pas être vides.");
    }
  }

  isSaveDisabled(): boolean {
    return !this.enqueteTitle || !this.questions$M();
  }
}
