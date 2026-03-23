import express, { Express } from 'express';

import serverConfig from './config/serverConfig';
import produceSampleJob from './producers/sampleQueueProducer';
import apiRouter from './routes';
// Import the worker and producer
import sampleWorker from './workers/sampleWorker';

const app: Express = express();

// Standard middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use('/api', apiRouter);

app.listen(serverConfig.PORT, () => {
    console.log(`[SUCCESS] : Server is Up at http://localhost:${serverConfig.PORT}`);

    // 1. Initialize the BullMQ Worker to listen on 'SampleQueue'
    sampleWorker('SampleQueue');

    // 2. Directly test the queue without waiting for an API request
    console.log('\n[Direct Test] Pushing a test job to the queue in 2 seconds...');

    // We use a slight timeout to ensure the worker is fully bound to Redis before producing
    setTimeout(async () => {
        try {
            const mockExecutionPayload = {
                language: 'cpp',
                code: '#include <iostream>\nusing namespace std;\nint main() {\n\tcout << "Direct test from index.ts successful!";\n\treturn 0;\n}',
            };

            // Pass 'SampleJob' as the job name and the mock data as the payload
            await produceSampleJob('SampleJob', mockExecutionPayload);
        } catch (error) {
            console.error('[Direct Test] Failed to produce job:', error);
        }
    }, 2000);
});
