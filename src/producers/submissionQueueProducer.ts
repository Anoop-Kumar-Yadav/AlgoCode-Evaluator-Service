import { submissionQueue } from '../queues/submissionQueue';

export default async function (payload: Record<string, unknown>) {
    const job = await submissionQueue.add('SubmissionJob', payload);
    console.log(`Successfully added new Submission job with ID: ${job.id}`);
    return job;
}
