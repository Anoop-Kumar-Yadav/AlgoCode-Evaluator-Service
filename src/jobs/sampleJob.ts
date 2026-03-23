import { Job } from 'bullmq';

import { IJob } from '../types/bullMqJobDefinition';
import { WorkerResponse } from '../types/bullMqWorkerResponse';

export default class SampleJob implements IJob {
    name: string;
    payload?: Record<string, unknown>;

    constructor(payload: Record<string, unknown>) {
        this.payload = payload;
        this.name = this.constructor.name;
    }
    handle = async (job?: Job): Promise<WorkerResponse> => {
        console.log(`[Job] Executing ${this.name}...`);
        console.log(`[Job] Payload received:`, this.payload);

        // Simulate execution delay (e.g., running an algorithm)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log(`[Job] Execution completed successfully.`);

        return {
            status: 'SUCCESS',
            message: 'Code executed successfully',
            output: 'Hello, World!',
        };
    };

    failed = async (job?: Job) => {
        console.log(`[Job Failed] Job ${job?.id} failed to execute.`);
        if (job) {
            console.log(job.id);
        }
    };
}
