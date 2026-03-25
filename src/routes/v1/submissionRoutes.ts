import express from 'express';

import { addSubmission } from '../../controller/submissionController';
import { CreateSubmissionZodSchema } from '../../dtos/createSubmissionDto';
import { validateCreateSubmisisonDto } from './../../validators/createSubmissionValidator';

const submissionRouter = express.Router();

submissionRouter.post('/', validateCreateSubmisisonDto(CreateSubmissionZodSchema), addSubmission);

export default submissionRouter;
