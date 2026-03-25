import express, { Request, Response } from 'express';

import submissionRouter from './submissionRoutes';

const v1Router = express.Router();

v1Router.use('/submission', submissionRouter);

v1Router.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'API V1 is alive' });
});
export default v1Router;
