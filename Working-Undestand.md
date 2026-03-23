### The Execution Flow

1.  **The Trigger (Routes & Controllers):** A user submits a request to your Express API (e.g., submitting an algorithm for execution). The Router forwards this to the Controller.

2.  **The Handoff (Producer):** Instead of executing the heavy task immediately and making the user wait, the Controller passes the data payload to the **Producer**.

3.  **The Broker (Queue & Redis):** The Producer wraps the payload into a "Job" and pushes it into the **Queue**. The Queue is backed by Redis, which safely stores the job in memory. At this point, the Controller immediately responds to the user ("Task received!"), freeing up the API to handle the next request.

4.  **The Listener (Worker):** Operating independently in the background, the **Worker** constantly monitors the Queue. The moment a new job appears in Redis, the Worker pulls it off the queue.

5.  **The Execution (Job Logic):** The Worker identifies the type of job and passes the data to the specific **Job Class** (e.g., `SampleJob`). The Job Class contains the actual heavy-lifting logic (like executing algorithms). If it succeeds, it marks the job complete; if it fails, it can automatically retry or log the error.

---

### The Complete Implementation

```typescript
title Crisis Response Event-Driven Architecture

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

// src/config/serverConfig.ts
import dotenv from 'dotenv';
dotenv.config();

export default {
    PORT: process.env.PORT || 3000,
    REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
};

// src/config/redisConfig.ts
import serverConfig from './serverConfig';

// MaxRetriesPerRequest must be null for BullMQ to process jobs without polling loops
export default {
    host: serverConfig.REDIS_HOST,
    port: serverConfig.REDIS_PORT,
    maxRetriesPerRequest: null,
};

// ============================================================================
// 2. TYPES
// ============================================================================

// src/types/bullMqWorkerResponse.ts
export interface WorkerResponse {
    status: 'SUCCESS' | 'FAILED';
    message: string;
    output?: string;
    error?: string;
}

// src/types/bullMqJobDefinition.ts
import { Job } from 'bullmq';
import { WorkerResponse } from './bullMqWorkerResponse';

export interface IJob {
    name: string;
    payload?: Record<string, unknown>;
    handle: (job?: Job) => Promise<WorkerResponse>;
    failed: (job?: Job) => void;
}

// ============================================================================
// 3. QUEUE INITIALIZATION
// ============================================================================

// src/queues/sampleQueue.ts
import { Queue } from 'bullmq';
import redisConfig from '../config/redisConfig';

export const SampleQueue = new Queue('SampleQueue', {
    connection: redisConfig
});

// ============================================================================
// 4. JOB LOGIC (The Heavy Lifting)
// ============================================================================

// src/jobs/sampleJob.ts
import { Job } from 'bullmq';
import { IJob } from '../types/bullMqJobDefinition';
import { WorkerResponse } from '../types/bullMqWorkerResponse';

export default class SampleJob implements IJob {
    name: string;
    payload: Record<string, unknown>;

    constructor(payload: Record<string, unknown>) {
        this.name = this.constructor.name;
        this.payload = payload;
    }

    handle = async (job?: Job): Promise<WorkerResponse> => {
        console.log(`[Job] Executing ${this.name} (ID: ${job?.id})...`);

        // Simulating heavy compilation/execution (e.g., running C++ DSA solutions)
        await new Promise(resolve => setTimeout(resolve, 2500));

        console.log(`[Job] Execution logic complete.`);
        return {
            status: 'SUCCESS',
            message: 'Algorithm executed successfully',
            output: 'Processed safely in the background.'
        };
    };

    failed = (job?: Job) => {
        console.error(`[Job] Cleanup or alert logic for failed job ${job?.id}`);
    };
}

// ============================================================================
// 5. PRODUCER (Adding to the Queue)
// ============================================================================

// src/producers/sampleQueueProducer.ts
import { SampleQueue } from '../queues/sampleQueue';

export default async function produceJob(name: string, payload: Record<string, unknown>) {
    const job = await SampleQueue.add(name, payload);
    console.log(`[Producer] Dispatched job '${name}' to queue. Assigned ID: ${job.id}`);
    return job;
}

// ============================================================================
// 6. WORKER (Processing the Queue)
// ============================================================================

// src/workers/sampleWorker.ts
import { Job, Worker } from 'bullmq';
import redisConfig from '../config/redisConfig';
import SampleJob from '../jobs/sampleJob';

export default function startSampleWorker(queueName: string) {
    console.log(`[Worker] Booted up and listening on queue: ${queueName}`);

    const worker = new Worker(
        queueName,
        async (job: Job) => {
            console.log(`[Worker] Pulled job ${job.id} (${job.name}) from Redis.`);
            if (job.name === 'SampleJob') {
                const sampleJobInstance = new SampleJob(job.data);
                return await sampleJobInstance.handle(job);
            }
        },
        { connection: redisConfig }
    );

    worker.on('completed', (job: Job, returnvalue: unknown) => {
        console.log(`[Worker] Job ${job.id} finalized. Result:`, returnvalue);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
        console.error(`[Worker] Job ${job?.id} crashed:`, err.message);
        if (job && job.name === 'SampleJob') {
            const failedJobInstance = new SampleJob(job.data);
            failedJobInstance.failed(job);
        }
    });

    return worker;
}

// ============================================================================
// 7. API LAYER (Controllers & Routes)
// ============================================================================

// src/controller/pingController.ts
import { Request, Response } from 'express';
import produceJob from '../producers/sampleQueueProducer';

export const pingController = async (req: Request, res: Response): Promise<void> => {
    try {
        const payload = req.body && Object.keys(req.body).length > 0
            ? req.body
            : { event: 'System Check', timestamp: Date.now() };

        // Handoff to the queue, don't wait for execution
        const job = await produceJob('SampleJob', payload);

        res.status(202).json({
            success: true,
            message: 'Request accepted and queued for processing.',
            jobId: job.id
        });
    } catch (error) {
        console.error('[Controller] Queue error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// src/routes/v1/index.ts
import { Router } from 'express';
import { pingController } from '../../controller/pingController';

const v1Router = Router();
v1Router.post('/ping', pingController);
// Also allow GET for easy browser testing
v1Router.get('/ping', pingController);

export default v1Router;

// src/routes/index.ts
import { Router } from 'express';
import v1Router from './v1';

const apiRouter = Router();
apiRouter.use('/v1', v1Router);

export default apiRouter;

// ============================================================================
// 8. SERVER ENTRY POINT
// ============================================================================

// src/index.ts
import express, { Express } from 'express';
import serverConfig from './config/serverConfig';
import apiRouter from './routes';
import startSampleWorker from './workers/sampleWorker';

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRouter);

app.listen(serverConfig.PORT, () => {
    console.log(`\n[SUCCESS] Server is up on http://localhost:${serverConfig.PORT}`);

    // Boot the background worker alongside the API
    startSampleWorker('SampleQueue');
});
```
