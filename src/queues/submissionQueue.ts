import { Queue } from 'bullmq';

import redisConfig from '../config/redisConfig';

export const submissionQueue = new Queue('SubmissionQueue', { connection: redisConfig });
