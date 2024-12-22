import express, { Request, Response } from "express";
import { secureMiddleware } from "../authMiddleware";
import { expenses } from "../database";
import { Expense } from "../interfaces";

export function expenseRouter() {
    const router = express.Router();

    // View all expenses
    router.get("/view-expenses", secureMiddleware, async (req, res: any) => {
        try {
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
            res.render("view-expenses", {
                expenses: userExpenses,
                filter: filter || "",
                search: search || "",
            });
        } catch (error) {
            console.error("Error fetching user-specific expenses:", error);
            res.status(500).send("Interne serverfout bij het ophalen van uitgaven.");
        }
    });

    // Add new expense
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

    // Display the Add Expense Page
    router.get("/add-expense", secureMiddleware, (req, res: any) => {
        if (!req.user || !req.user.id) {
            return res.status(401).send("Je bent niet ingelogd.");
        }

        res.render("add-expense", {
            user: req.user,
        });
    });

    // Update an existing expense
    router.post("/update-expense/:id", secureMiddleware, async (req, res: any) => {
        const id = req.params.id;
        const { description, amount, currency, date, category, isPaid, isIncoming } = req.body;

        if (!req.user || !req.user.id) {
            return res.status(401).send("Je bent niet ingelogd.");
        }

        const expense = await expenses.findOne({ id, userId: req.user.id });
        if (!expense) {
            return res.status(403).send("Je hebt geen rechten om deze uitgave bij te werken.");
        }

        await expenses.updateOne(
            { id, userId: req.user.id },
            {
                $set: {
                    description,
                    amount: parseFloat(amount),
                    currency,
                    date: new Date(date).toISOString(),
                    category,
                    isPaid: isPaid === "true",
                    isIncoming: isIncoming === "true",
                },
            }
        );

        console.log(`Expense ${id} updated successfully.`);
        res.redirect("/view-expenses");
    });

    // Delete an expense
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
