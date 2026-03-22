import express, { Request, Response } from 'express';

const v1Router = express.Router();

v1Router.get('/', (req: Request, res: Response): void => {
    res.json({ message: 'API V1 is alive' });
});
export default v1Router;
