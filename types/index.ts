export type DeliveryProvider =
    | 'github'
    | 'figma'
    | 'google_drive'
    | 'google_analytics'
    | string;

export interface Service {
    id?: number | string;
    name?: string;
    delivery_provider: DeliveryProvider;
    [key: string]: unknown;
}

export interface Project {
    id: number | string;
    service?: Service | null;
    delivery_type: string;
    delivery_settings: any;
    [key: string]: unknown;
}
