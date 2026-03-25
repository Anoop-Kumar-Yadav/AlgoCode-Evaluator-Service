import express, { NextFunction, Request, Response } from 'express';

import v1Router from './v1';

const apiRouter = express.Router();

function printReq(req: Request, res: Response, next: NextFunction) {
    console.log(req.body);
    next();
}

apiRouter.use('/v1', printReq, v1Router);

export default apiRouter;
