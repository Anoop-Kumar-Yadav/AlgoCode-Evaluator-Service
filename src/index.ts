// title Crisis Response Event-Driven Architecture
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import express, { Express } from 'express';
import { unknown } from 'zod';

import serverConfig from './config/serverConfig';
import submissionQueueProducer from './producers/submissionQueueProducer';
import { SampleQueue } from './queues/sampleQueue';
// import { SubmissionQueue } from './queues/submissionQueue'; // Ensure you import your actual Queue object here!
import apiRouter from './routes';
import { SUBMISSION_QUEUE } from './utils/constants';
import sampleWorker from './workers/sampleWorker';
import submissionWorker from './workers/submissionQueueWorker';

const app: Express = express();

// Standard middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- BULL BOARD SETUP ---
// 1. Initialize the Express adapter
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// 2. Attach your BullMQ queues to the board
createBullBoard({
    queues: [
        new BullMQAdapter(SampleQueue),
        // new BullMQAdapter(SubmissionQueue) // Uncomment once you import the actual SubmissionQueue object
    ],
    serverAdapter: serverAdapter,
});

// 3. Mount the UI route
app.use('/admin/queues', serverAdapter.getRouter());
// ------------------------

// Register API routes
app.use('/api', apiRouter);

app.listen(serverConfig.PORT, () => {
    console.log(`[SUCCESS] : Server is Up at http://localhost:${serverConfig.PORT}`);
    console.log(
        `[INFO]    : Bull Board UI available at http://localhost:${serverConfig.PORT}/admin/queues`,
    );

    sampleWorker('SampleQueue');
    submissionWorker(SUBMISSION_QUEUE);
    submissionQueueProducer({
        '1234': {
            language: 'CPP',
            inputCase: `Hello World`,
            code: `print("Hello World")`,
        },
    });

    /* const userPyCode = `
    print(x)
    `; */
    // stub code  ----> set by the problem setter
    /*  const PyCode = `
def run(x = "unknown"):
${userPyCode}

X = input()
run(X)
    `; */
    // runPython(PyCode, { input: 'anoop', output: 'anoop' });

    // const userJavaCode = `
    // Scanner scanner = new Scanner(System.in);
    // int x = scanner.nextInt();
    // System.out.println(x);
    // `;

    // stub code  ----> set by the problem setter
    /* const javaCode = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        ${userJavaCode}
    }
}
    `; */

    // runJava(javaCode, { input: '100', output: '100' });
});
