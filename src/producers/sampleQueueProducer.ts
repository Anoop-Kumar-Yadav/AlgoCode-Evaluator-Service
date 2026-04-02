import { SampleQueue } from '../queues/sampleQueue';

export default async function (name: string, payload: Record<string, unknown>) {
    const job = await SampleQueue.add(name, payload);
    console.log(`[Producer] Successfully added job to queue with ID: ${job.id}`);
    return job;
}
