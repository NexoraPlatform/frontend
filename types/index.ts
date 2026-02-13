export type DeliveryProvider =
    | 'github'
    | 'figma'
    | 'google_drive'
    | 'google_analytics'
    | 'manual_upload'
    | string;

export interface Service {
    id?: number | string;
    name?: string;
    delivery_provider: DeliveryProvider;
    [key: string]: unknown;
}

export type ProjectLineStatus = 'pending' | 'active' | 'completed' | 'review' | string;

export interface ProjectLine {
    id: number | string;
    title: string;
    description?: string;
    status: ProjectLineStatus;
    delivery_provider: DeliveryProvider;
    budget_allocation: number;
    [key: string]: unknown;
}

export interface Project {
    id: number | string;
    project_lines?: ProjectLine[];
    service?: Service | null;
    delivery_type?: string;
    delivery_settings?: any;
    delivery_provider?: DeliveryProvider;
    service_id?: number | string | null;
    [key: string]: unknown;
}
