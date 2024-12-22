import express, { Express, Request, Response } from "express";
import { isNotAuthenticated, secureMiddleware } from "../authMiddleware";
import { expenses, users } from "../database";
import bcrypt from "bcrypt";
import { Expense, User } from "../interfaces";

export function expenseRouter() {
    const router = express.Router();

// Kosten Toevoegen
router.get("/view-expenses", secureMiddleware, async (req, res: any) => {
    if (!req.user || !req.user.id) {
        return res.status(401).send("Je bent niet ingelogd.");
    }

    const filter = req.query.filter as string;
    const search = req.query.search as string;
    let query: any = { userId: req.user.id };

    if (filter === "true") {
        query.isIncoming = true;
    } else if (filter === "false") {
        query.isIncoming = false;
    }

    if (search && search.trim() !== "") {
        query.description = { $regex: search.trim(), $options: "i" };
    }

    const userExpenses = await expenses.find(query).toArray();
    console.log("User-specific Expenses:", userExpenses);

    res.render("view-expenses", {
        expenses: userExpenses,
        filter: filter || "",
        search: search || "",
    });
});


// Kosten Toevoegen
router.post("/add-expense", secureMiddleware, async (req, res: any) => {
    const { isIncoming, description, amount, paymentMethod, cardDetails, bankAccountNumber, category, isPaid } = req.body;

    if (!req.user || !req.user.id) {
        return res.status(401).send("Je bent niet ingelogd.");
    }

    const newExpense: Expense = {
        id: "expense" + String(await expenses.countDocuments() + 1),
        description,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        currency: "EUR",
        paymentMethod: {
            method: paymentMethod,
            ...(paymentMethod === "Credit Card" && { cardDetails }),
            ...(paymentMethod === "Bank Transfer" && { bankAccountNumber }),
        },
        isIncoming: isIncoming === "true",
        category,
        tags: [],
        isPaid: isPaid === "on",
        userId: req.user.id,
    };

    await expenses.insertOne(newExpense);
    console.log("New expense added:", newExpense);

    res.redirect("/view-expenses");
});


// Kosten Bekijken
router.get("/view-expenses", secureMiddleware, async (req, res: any) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Je bent niet ingelogd.");
        }
        const filter = req.query.filter as string;
        const search = req.query.search as string;

        // altijd filteren op de ingelogde gebruiker
        let query: any = { userId: req.user.id };

        if (filter === "true") {
            query.isIncoming = true;
        } else if (filter === "false") {
            query.isIncoming = false;
        }

        if (search && search.trim() !== "") {
            query.description = { $regex: search.trim(), $options: "i" };
        }

        const userExpenses = await expenses.find(query).toArray();
        console.log("Gebruikersspecifieke Expenses:", userExpenses);

        res.render("view-expenses", {
            expenses: userExpenses,
            filter: filter || "",
            search: search || "",
        });
    } catch (error) {
        console.error("Fout bij ophalen van gebruikersspecifieke expenses:", error);
        res.status(500).send("Interne serverfout bij het ophalen van uitgaven.");
    }
});



// Kosten Toevoegen
router.get("/add-expense", secureMiddleware, (req, res) => {
    res.render("add-expense");
});

// Update een bestaande uitgave
router.post("/add-expense", secureMiddleware, async (req, res: any) => {
    const { isIncoming, description, amount, paymentMethod, cardDetails, bankAccountNumber, category, isPaid } = req.body;

    if (!req.user || !req.user.id) {
        return res.status(401).send("Je bent niet ingelogd.");
    }

    const newExpense: Expense = {
        id: "expense" + String(await expenses.countDocuments() + 1),
        description,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        currency: "EUR",
        paymentMethod: {
            method: paymentMethod,
            ...(paymentMethod === "Credit Card" && { cardDetails }),
            ...(paymentMethod === "Bank Transfer" && { bankAccountNumber }),
        },
        isIncoming: isIncoming === "true",
        category,
        tags: [],
        isPaid: isPaid === "on",
        userId: req.user.id, // Correct gekoppeld aan de huidige gebruiker
    };

    await expenses.insertOne(newExpense);
    console.log("Nieuwe uitgave toegevoegd:", newExpense);

    res.redirect("/view-expenses");
});

// Verwijder een uitgave
router.get("/delete-expense/:id", secureMiddleware, async (req, res: any) => {
    const id = req.params.id;

    if (!req.user || !req.user.id) {
        return res.status(401).send("Je bent niet ingelogd.");
    }

    const expense = await expenses.findOne({ id, userId: req.user.id });
    if (!expense) {
        return res.status(403).send("Je hebt geen rechten om deze uitgave te verwijderen.");
    }

    await expenses.deleteOne({ id, userId: req.user.id });
    console.log(`Expense ${id} deleted successfully.`);
    res.redirect("/view-expenses");
});


return router;
}