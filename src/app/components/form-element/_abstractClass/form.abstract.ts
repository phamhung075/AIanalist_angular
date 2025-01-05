import { EnqueteForm } from '@lib-academie-shared/*';
import { SignatureGenerateType } from './../../models/SignatureCoordinates';
import { EnumCategorieContactModifiable_CONSULTANT_GERANT, EnumCategorieContactModifiable_MANAGER_ABONNE, EnumCategorieContactModifiable_CONSULTANT_ABONNE } from './../../enums/EnumContact';
import { ChangeDetectorRef, model, signal } from "@angular/core";
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { EnumConditionTVAEntreprise_FR, EnumFormJuridiqueEntreprise_FR } from "../../enums/EnumAcademieAudite";
import { EnumCategorieContact, EnumCategorieContactModifiable } from "../../enums/EnumContact";
import { EnumStatutEntreeSortie } from "../../enums/EnumEntreeSortie";
import { EnumTypeResultatPasseportEvaluation } from "../../enums/EnumPasseportEvaluation";
import { IOption } from "../../models/_generic/options.interface";
import { ParseUtilsAbstract } from "../../services/parse-utils/parse-utils.abstract";
import { EnumStatutEmargement } from "../../enums/EnumEmargement";
import { EnumTypeMethodeProgrammeFormation } from '../../enums/EnumProgrammeFormation';
import { EnumListDocType, EnumCategorieDocType, EnumStatutDocSigned } from '../../enums/EnumDocType';
import { EnumPartiePrenanteDemandeAmelioration, EnumStatutDemandeAmelioration } from '../../enums/EnumDemandeAmelioration';
import { EnumAuditeIndicateurResultat, EnumStatutIndicateurResultat } from '../../enums/EnumIndicateurResultat';
import { EnumPartiePrenanteReclamation, EnumStatutReclamation } from '../../enums/EnumReclamation';
import { EnumEtapePlanDeveloppementCompetence, EnumPartiePrenantePlanDeveloppementCompetence, EnumObjectifsPlanDeveloppementCompetence } from '../../enums/EnumPlanDeveloppementCompetence';
import { EnumTypeEntretienRecrutementCollaborateur, EnumTypeContratRecrutementCollaborateur, EnumRythmeRecrutementCollaborateur, EnumExperienceRecrutementCollaborateur, EnumMotivationRecrutementCollaborateur, EnumStatusRecrutementCollaborateur } from '../../enums/EnumRecrutementCollaborateur';
import { EnumTrueBoolean, EnumYesBoolean } from '../../enums/EnumBoolean';
import { EnumExperienceSelectionSousTraitant, EnumMotivationSelectionSousTraitant, EnumRythmeSelectionSousTraitant, EnumStatusSelectionSousTraitant } from '../../enums/EnumSelectionSousTraitant';
import { EnumCategorieEnqueteRecueil, EnumStatusEnqueteRecueil, } from '../../enums/EnumEnqueteRecueil';
import { EnumTypeCompteRenduReunion } from '../../enums/EnumCompteRenduReunion';
import { EnumTypeMethodeEmargement } from '../../enums/EnumEmargement';
import { EnumGroupContactRecu } from '../../enums/EnumEnqueteRecueil';



export abstract class ClassFormBase_MCR extends ParseUtilsAbstract {
	abstract classDescription: string; // Subclasses must define their Class Description for messages
	abstract form: FormGroup;
	_testView$S = signal<boolean>(false) // use signal à la place
	isLoading$S = signal<boolean>(false);

	_categorieContactDefaultInit: EnumCategorieContact[] = [EnumCategorieContact.NONDEFINI] as EnumCategorieContact[];

	_categorieContactPresident: EnumCategorieContact[] = [EnumCategorieContact.PRESIDENT_ACADEMIE, EnumCategorieContact.PRESIDENT_ENTREPRISE] as EnumCategorieContact[];
	_categorieContactPresidentAcademieInit: EnumCategorieContact[] = [EnumCategorieContact.PRESIDENT_ACADEMIE] as EnumCategorieContact[];
	_categorieContactPresidentEntrepriseInit: EnumCategorieContact[] = [EnumCategorieContact.PRESIDENT_ENTREPRISE] as EnumCategorieContact[];

	_categorieContactBenificiaire: EnumCategorieContact[] = [EnumCategorieContact.BENEFICIAIRE] as EnumCategorieContact[];
	_categorieContactBenificiaireInit: EnumCategorieContact[] = [EnumCategorieContact.BENEFICIAIRE] as EnumCategorieContact[];

	_categorieContactManager: EnumCategorieContact[] = [EnumCategorieContact.MANAGER_GERANT, EnumCategorieContact.MANAGER_GERANT] as EnumCategorieContact[];
	_categorieContactConsultant: EnumCategorieContact[] = [EnumCategorieContact.CONSULTANT_GERANT, EnumCategorieContact.CONSULTANT_ABONNE] as EnumCategorieContact[];
	
	_categorieContactEquipeCandidature: EnumCategorieContact[] = [EnumCategorieContact.CONSULTANT_GERANT, EnumCategorieContact.CONSULTANT_ABONNE, EnumCategorieContact.FORMATEUR, EnumCategorieContact.RESPONSABLE_HANDICAP, EnumCategorieContact.RESPONSABLE_PEDAGOGIQUE] as EnumCategorieContact[];

	_categorieContactConsultantGerant: EnumCategorieContact[] = [EnumCategorieContact.CONSULTANT_GERANT] as EnumCategorieContact[];
	_categorieContactConsultantGerantInit: EnumCategorieContact[] = [EnumCategorieContact.CONSULTANT_GERANT] as EnumCategorieContact[];

	_categorieContactConsultantAbonne: EnumCategorieContact[] = [EnumCategorieContact.CONSULTANT_ABONNE] as EnumCategorieContact[];
	_categorieContactConsultantAbonneInit: EnumCategorieContact[] = [EnumCategorieContact.CONSULTANT_ABONNE] as EnumCategorieContact[];

	_categorieContactManagerGerant: EnumCategorieContact[] = [EnumCategorieContact.MANAGER_GERANT] as EnumCategorieContact[];
	_categorieContactManagerGerantInit: EnumCategorieContact[] = [EnumCategorieContact.MANAGER_GERANT] as EnumCategorieContact[];

	_categorieContactManagerAbonne: EnumCategorieContact[] = [EnumCategorieContact.MANAGER_ABONNE] as EnumCategorieContact[];
	_categorieContactManagerAbonneInit: EnumCategorieContact[] = [EnumCategorieContact.MANAGER_ABONNE] as EnumCategorieContact[];

	_categorieContactResponsablePedagogique: EnumCategorieContact[] = [EnumCategorieContact.RESPONSABLE_PEDAGOGIQUE] as EnumCategorieContact[];
	_categorieContactResponsablePedagogiqueInit: EnumCategorieContact[] = [EnumCategorieContact.RESPONSABLE_PEDAGOGIQUE] as EnumCategorieContact[];

	_categorieContactResponsableHandicap: EnumCategorieContact[] = [EnumCategorieContact.RESPONSABLE_HANDICAP] as EnumCategorieContact[];
	_categorieContactResponsableHandicapInit: EnumCategorieContact[] = [EnumCategorieContact.RESPONSABLE_HANDICAP] as EnumCategorieContact[];

	_categorieContactFormateurs: EnumCategorieContact[] = [EnumCategorieContact.FORMATEUR] as EnumCategorieContact[];
	_categorieContactFormateursInit: EnumCategorieContact[] = [EnumCategorieContact.FORMATEUR] as EnumCategorieContact[];

	_categoriesContactModifiable_MANAGER_GERANT_IOption?: IOption[] = this._convertEnumToIOptions(EnumCategorieContactModifiable);
	_categoriesContactModifiable_CONSULTANT_GERANT_IOption?: IOption[] = this._convertEnumToIOptions(EnumCategorieContactModifiable_CONSULTANT_GERANT);
	_categoriesContactModifiable_MANAGER_ABONNE_IOption?: IOption[] = this._convertEnumToIOptions(EnumCategorieContactModifiable_MANAGER_ABONNE);
	_categoriesContactModifiable_CONSULTANT_ABONNE_IOption?: IOption[] = this._convertEnumToIOptions(EnumCategorieContactModifiable_CONSULTANT_ABONNE);

	_categoriesContactSelectList_IOption?: IOption[] = this._convertEnumToIOptions(EnumCategorieContact);
	_formeJuridiqueSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumFormJuridiqueEntreprise_FR);
	_conditionTVASelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumConditionTVAEntreprise_FR);
	_partiePrenanteDASelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumPartiePrenanteDemandeAmelioration);
	_statutDASelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatutDemandeAmelioration);

	_indicateurAuditeIRSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumAuditeIndicateurResultat)
	_statutIRSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatutIndicateurResultat)

	_partiePrenanteRESelectList_IOption?: IOption[] = this._convertEnumToIOptions(EnumPartiePrenanteReclamation);
	_statutRESelectList_IOption?: IOption[] = this._convertEnumToIOptions(EnumStatutReclamation);

	_etapePDCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumEtapePlanDeveloppementCompetence);
	_partiePrenantePDCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumPartiePrenantePlanDeveloppementCompetence);
	_objectifsPDCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumObjectifsPlanDeveloppementCompetence);

	_typeEntretienRCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumTypeEntretienRecrutementCollaborateur);
	_typeContratRCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumTypeContratRecrutementCollaborateur);
	_rythmeRCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumRythmeRecrutementCollaborateur);
	_experienceRCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumExperienceRecrutementCollaborateur);
	_motivationRCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumMotivationRecrutementCollaborateur);
	_statusRCSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatusRecrutementCollaborateur);

	_rythmeSSTSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumRythmeSelectionSousTraitant);
	_experienceSSTSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumExperienceSelectionSousTraitant);
	_motivationSSTSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumMotivationSelectionSousTraitant);
	_statusSSTSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatusSelectionSousTraitant);

	_categorieERSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumCategorieEnqueteRecueil);
	_statusERSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatusEnqueteRecueil);
	_statusERGroupContactRecuList_IOption: IOption[] = this._convertEnumToIOptions(EnumGroupContactRecu);


	_yesBooleanSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumYesBoolean);
	_trueBooleanSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumTrueBoolean);

	_academieGerantSelectList_IOption: IOption[] = this._convertStringArrayToIOptions(['Academie Gerante', 'Academie Abonnée']);
	_academieAbonneSelectList_IOption: IOption[] = this._convertStringArrayToIOptions(['Academie Abonnée']);
	_categoriesEntreeSortieList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatutEntreeSortie);
	_typeResultatEpreuve: IOption[] = this._convertEnumToIOptions(EnumTypeResultatPasseportEvaluation)
	_methodeMobiliseeSelectList_IOption: IOption[] = this._convertEnumToIOptions(EnumTypeMethodeProgrammeFormation);
	_typeSignature_IOption: IOption[] = this._convertEnumToIOptions(SignatureGenerateType);
	_typeMethodeEmargement_IOption: IOption[] = this._convertEnumToIOptions(EnumTypeMethodeEmargement);

	
	_categoriesDocTypeCategorie_IOption: IOption[] = this._convertEnumToIOptions(EnumCategorieDocType);
	_categoriesDocTypeList_IOption: IOption[] = this._convertEnumToIOptions(EnumListDocType);
	_statutDocSignedeList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatutDocSigned);

	_statutEmargementList_IOption: IOption[] = this._convertEnumToIOptions(EnumStatutEmargement);

	_typeCompteRenduReunionList_IOption: IOption[] = this._convertEnumToIOptions(EnumTypeCompteRenduReunion);

	statutEmargementList: EnumStatutEmargement[] = Object.values(EnumStatutEmargement) as EnumStatutEmargement[];

	_categoriesContactModifiable?: EnumCategorieContactModifiable[] = Object.values(EnumCategorieContactModifiable) as EnumCategorieContactModifiable[];
	_categoriesContactSelectList?: EnumCategorieContact[] = Object.values(EnumCategorieContact) as EnumCategorieContact[];
	_isEdit: boolean = true;



	constructor(
		changeDetectorRef: ChangeDetectorRef
	) {
		super(changeDetectorRef);
	}

	_selectedAcademieAuditeValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidAcademieAudite = control?.value && control?.value?.hasOwnProperty('denominationSociale') && control?.value?.hasOwnProperty('objectId');
			return isValidAcademieAudite ? null : { isValidAcademieAudite: true };
		};
	}


	_selectedAdresseFormationValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidAdresseFormation = control?.value && control?.value?.hasOwnProperty('labelAdresse') && control?.value?.hasOwnProperty('objectId');
			return isValidAdresseFormation ? null : { isValidAdresseFormation: true };
		};
	}

	_selectedCandidatureValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidCandidature = control?.value && control?.value?.hasOwnProperty('numeroDossier') && control?.value?.hasOwnProperty('objectId');
			return isValidCandidature ? null : { isValidCandidature: true };
		};
	}

	_selectedContactValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidContact = control?.value && control?.value?.hasOwnProperty('nom') && control?.value?.hasOwnProperty('prenom') && control?.value?.hasOwnProperty('objectId');
			return isValidContact ? null : { invalidContact: true };
		};
	}

	_selectedContactsArrayValidator(required: boolean = false): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			let validators: any = {}
			const value = control.value;
			// if(this._testView$S()) console.log("selectedContactsArrayValidator", value);
			console.log("selectedContactsArrayValidator", value);

			// if(this._testView$S()) console.log("is selectedContactsArrayValidator required:", required);
			console.log("is selectedContactsArrayValidator required:", required);

			// Check if the value is null
			if (value === null && required) {
				return { required: true };
			}

			// Check if the value is an array
			if (!Array.isArray(value)) {
				return { invalidContactArray: true };
			}

			// Check if the array is empty (always invalid)
			// if (this._testView$S()) console.log("Check if the array is empty (always invalid)", value.length);
			console.log("Check if the array is empty (always invalid)", value.length);

			if (value.length === 0) {
				return { emptyArray: true };
			}

			// Check if every item in the array is a valid contact
			const isValidContactArray = value.every((contact: any) =>
				contact &&
				typeof contact === 'object' &&
				'nom' in contact &&
				'prenom' in contact &&
				'objectId' in contact
			);
			return isValidContactArray ? null : { invalidContactArray: true };
		};
	}

	_selectedGuideActionValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidGuideAction = control?.value && control?.value?.hasOwnProperty('actionsPreventives') && control?.value?.hasOwnProperty('objectId');
			return isValidGuideAction ? null : { isValidGuideAction: true };
		};
	}

	_selectedFichePosteValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidFichePoste = control?.value && control?.value?.hasOwnProperty('titre') && control?.value?.hasOwnProperty('objectId');
			return isValidFichePoste ? null : { isValidFichePoste: true };
		};
	}

	_selectedProgrammeFormationValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidProgrammeFormation = control?.value && control?.value?.hasOwnProperty('titre') && control?.value?.hasOwnProperty('objectId');
			return isValidProgrammeFormation ? null : { invalidProgrammeFormation: true };
		};
	}

	_selectedEntrepriseValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidEntreprise = control?.value && control?.value?.hasOwnProperty('denominationSociale') && control?.value?.hasOwnProperty('objectId');
			return isValidEntreprise ? null : { isValidEntreprise: true };
		};
	}

	_selectedEpreuveValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidEpreuve = control?.value && control?.value?.hasOwnProperty('titre') && control?.value?.hasOwnProperty('objectId');
			return isValidEpreuve ? null : { isValidEpreuve: true };
		};
	}

	_selectedEquipeCandidatureValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidEquipeCandidature = control?.value && control?.value?.hasOwnProperty('labelEquipe') && control?.value?.hasOwnProperty('objectId');
			return isValidEquipeCandidature ? null : { isValidEquipeCandidature: true };
		};
	}

	_selectedProgrammeValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidProgramme = control?.value && control?.value?.hasOwnProperty('titre') && control?.value?.hasOwnProperty('objectId');
			return isValidProgramme ? null : { isValidProgramme: true };
		};
	}

	_selectedEnqueteFormValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidEnqueteForm = control?.value && control?.value?.hasOwnProperty('titre') && control?.value?.hasOwnProperty('objectId');
			return isValidEnqueteForm ? null : { isValidEnqueteForm: true };
		};
	}


	_selectedTypeResultatValidator(required?: boolean): ValidatorFn {
		return (control: AbstractControl): ValidationErrors | null => {
			if (!control?.value && !required) {
				return null;  // Aucune validation si le champ est vide et non requis
			}
			const isValidTypeResultat = Object.values(EnumTypeResultatPasseportEvaluation).includes(control?.value);
			return isValidTypeResultat ? null : { isValidTypeResultat: true };
		};
	}

	setControlNoteditable(controlName: string): void {
		const control = this.form.get(controlName);
		control?.disable({ emitEvent: true });
		control?.clearValidators();
		control?.updateValueAndValidity({ emitEvent: true });
		control?.markAsTouched({ onlySelf: false });
		this.changeDetectorRef.markForCheck();
	}

	setControlEditable(
		controlName: string,
		isRequired: boolean = false,
	): void {
		const control = this.form.get(controlName);
		control?.enable({ emitEvent: true });
		if (isRequired) {
			control?.setValidators(Validators.required);
		}
		control?.updateValueAndValidity({ emitEvent: true });
		control?.markAsTouched({ onlySelf: false });
		this.changeDetectorRef.markForCheck();
	}
}
