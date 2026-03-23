import { Job } from 'bullmq';

import { WorkerResponse } from './bullMqWorkerResponse';

export interface IJob {
    name: string;
    payload?: Record<string, unknown>;

    handle: (job?: Job) => Promise<WorkerResponse>;
    failed: (job?: Job) => void;
}
