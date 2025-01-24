import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config";

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tokenFromHeader = req.headers["authorization"];
  const decoded = jwt.verify(tokenFromHeader as string, SECRET_KEY);
  if (decoded) {
    //@ts-ignore
    req.userId = decoded.id;
    next();
  } else {
    res.status(403).json({
      message: "You are not logged-in",
    });
  }
};
