import { NextFunction, Request, Response } from 'express';

export type ExpressHandler = (req: Request, res: Response, next: NextFunction) => Promise<void> | void;
