import express, { Express, Request, Response } from "express";
import { isNotAuthenticated, secureMiddleware } from "../authMiddleware";
import { expenses, users } from "../database";
import bcrypt from "bcrypt";
import { Expense, User } from "../interfaces";

export function registerRouter() {
    const router = express.Router();




router.get("/register", (req, res) => {
    res.render("registerUser");
});

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const newUser: User = {
            id: "user" + String(await users.countDocuments() + 1),
            name,
            email,
            password: bcrypt.hashSync(password, 10),
            expenses: [],
            budget: {
                monthlyLimit: 1000,
                notificationThreshold: 0.9,
                isActive: true,
            }
        };

        await users.insertOne(newUser);
        console.log(`Nieuwe gebruiker geregistreerd: ${name}`);
        res.redirect("/login");
    } catch (error) {
        console.error("Fout bij registratie van gebruiker:", error);
        res.status(500).send("Er is een fout opgetreden bij het registreren van de gebruiker.");
    }
});

return router;
}
