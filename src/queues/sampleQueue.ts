import { Queue } from 'bullmq';

import redisConfig from '../config/redisConfig';

export const SampleQueue = new Queue('SampleQueue', { connection: redisConfig });
