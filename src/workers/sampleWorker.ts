import { Job, Worker } from 'bullmq';

import redisConfig from '../config/redisConfig';
import SampleJob from '../jobs/sampleJob';

export default function sampleWorker(queueName: string) {
    console.log('[Worker] Starting SampleWorker, waiting for jobs...');
    const worker = new Worker(
        queueName,
        async (job: Job) => {
            console.log(`[Worker] Picked up job: ${job.id} of type ${job.name}`);
            if (job.name === 'SampleJob') {
                const sampleJobInstance = new SampleJob(job.data);
                return await sampleJobInstance.handle(job);
            }
        },
        {
            connection: redisConfig,
        },
    );

    worker.on('completed', (job: Job, returnvalue: unknown) => {
        console.log(`[Worker] Job ${job.id} completed. Result:`, returnvalue);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
        console.error(`[Worker] Job ${job?.id} failed with error:`, err.message);
        if (job && job.name === 'SampleJob') {
            const failedJobInstance = new SampleJob(job.data);
            failedJobInstance.failed(job);
        }
    });

    return worker;
}
