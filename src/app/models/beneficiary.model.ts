export interface Beneficiary {
    id?: string;
    kyl_id: string;
    first_name: string;
    last_name: string;
    birth_date: Date;
    email?: string | null;
    phone: string;
    address: string;
    id_type: 'cni' | 'passport' | 'titre_sejour';
    id_number: string;
    video_key?: string | null;
    verification_status: 'pending' | 'approved' | 'rejected';
    verification_notes?: string | null;
    verification_date?: Date | null;
    created_at: Date;
    updated_at: Date;
}