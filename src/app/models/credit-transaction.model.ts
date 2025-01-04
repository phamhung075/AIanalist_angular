// Les modèles qui correspondent à la BDD
export interface CreditTransaction {
    id?: string;
    user_id: string;
    amount: number;
    transaction_type: 'purchase' | 'usage';
    description: string;
    created_at?: Date;
}