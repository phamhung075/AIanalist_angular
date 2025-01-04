export interface User {
    id: string;
    email: string;
    company_name: string;
    phone: string;
    siret: string;
    address: string;
    notification: boolean;
    is_active: boolean;
    total_benefit: number;
    role: string;
    credits_balance: number;
    kyls_count: number;
    credits_count: number;
    updated_at: Date;
    created_at: Date;
}