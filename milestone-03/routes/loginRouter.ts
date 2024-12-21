import express, { Express, Request, Response } from "express";
import { isNotAuthenticated } from "../authMiddleware";
import { users } from "../database";
import bcrypt from "bcrypt";
import { User } from "../interfaces";


export function loginRouter() {
    const router = express.Router();
    // Login page
router.get("/login", isNotAuthenticated, (req, res) => {
    res.render("login");
});

// Login form submission
router.post("/login", async (req, res: any) => {
    const { email, password } = req.body;

    try {
        const user = await users.findOne({ email: email.toString() }) as User | null;

        if (!user) {
            res.status(400).send("Ongeldig e-mailadres of wachtwoord");
            return res.redirect("/login");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(400).send("Ongeldig e-mailadres of wachtwoord");
            return res.redirect("/login");
        }

        // Sla de gebruikers-ID op in de sessie
        req.session.user = user;
        console.log(`Gebruiker ingelogd: ${user.name}`);

        res.redirect("/index");
    } catch (error) {
        console.error("Fout bij inloggen:", error);
        res.status(500).send("Interne serverfout bij inloggen.");
    }
});

router.post("/logout", (req, res) => {
    req.session.destroy((err: any) => {
        if (err) {
            console.error("Fout bij uitloggen:", err);
            res.status(500).send("Uitloggen mislukt");
        }
        else {
            res.redirect("/login");
        }
    });
});

return router;
}
