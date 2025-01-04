import { Beneficiary } from "./beneficiary.model";
import { Formation } from "./formation.model";

export interface KYL {
    id?: string;
    user_id: string;
    formation_id: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    created_at: Date;
    updated_at: Date;
    beneficiary?: Beneficiary;
    formation?: Formation;
    session_start: Date;
    video: string;
    documenttype: string;
    numero_unique?: number;
    dossier_at: Date;
    documents: {
        recto: {
            side: string;
            type: string;
            image: string;
        },
        verso: {
            side: string;
            type: string;
            image: string;
        }
    }
    session_end: Date;
}

export interface CreateKYLDto {
    formation_id: string;
    session_start: Date;
    session_end: Date;
    beneficiary: {
        first_name: string;
        last_name: string;
        birth_date: Date | string;
        email?: string;
        phone: string;
        address: string;
        id_type?: 'cni' | 'passport' | 'titre_sejour';
        id_number?: string;
    };
}