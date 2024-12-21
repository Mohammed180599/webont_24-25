import { Request, Response, NextFunction } from "express";

// Middleware om te controleren of een gebruiker is ingelogd
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.id) {
        next();
    }
    else {
        res.redirect("/login");
    }
}

// Middleware om te controleren of een gebruiker NIET is ingelogd
export function isNotAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.session && req.session.id) {
        return res.redirect("/login");
    }
    next();
}

export function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.user) {
        res.locals.user = req.session.user;
        next();
    } else {
        res.redirect("/login");
    }
};