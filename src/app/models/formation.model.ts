export interface Formation {
    id?: string;
    name: string;
    duration: number;
    description: string;
    prerequisites: string;
    objectives: string;
    access_modalities: string;
    methods: string;
    evaluation: string;
    status: 'Actif' | 'Brouillon' | 'Archivé';
    created_at: Date;
    updated_at: Date;
}