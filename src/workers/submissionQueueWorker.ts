import { Job, Worker } from 'bullmq';

import redisConfig from '../config/redisConfig';
import SubmissionJob from '../jobs/submissionJob';

export default function submissionWorker(queueName: string) {
    console.log('[Worker] Starting Submission Worker, waiting for jobs...');
    const worker = new Worker(
        queueName,
        async (job: Job) => {
            console.log(`[Submission Worker] Picked up job: ${job.id} of type ${job.name}`);
            if (job.name === 'SubmissionJob') {
                const submissionJobInstance = new SubmissionJob(job.data);
                return await submissionJobInstance.handle(job);
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
        if (job && job.name === 'SubmissionJob') {
            const failedJobInstance = new job.data();
            failedJobInstance.failed(job);
        }
    });

    return worker;
}
