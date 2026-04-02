export interface WorkerResponse {
    status: 'SUCCESS' | 'FAILED';
    message: string;
    output?: string;
    error?: string;
}
