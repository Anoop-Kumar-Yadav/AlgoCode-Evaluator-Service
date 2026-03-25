import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

export const validateCreateSubmisisonDto =
    (schema: ZodSchema<unknown>) => (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                ...req.body,
            });
            next();
        } catch (error) {
            console.log(error);
            return res.status(400).json({
                message: 'Bad Request',
            });
        }
    };
