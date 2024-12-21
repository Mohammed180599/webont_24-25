import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import { User, Expense } from "./interfaces"; // Import interfaces
import { connect, users, expenses } from "./database";
import sessionMiddleware from "./sessions";
import { isAuthenticated, isNotAuthenticated, secureMiddleware } from "./authMiddleware";

import data from "./data.json";
dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});


app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000); // process.env.PORT || 3000

//
// ✅ User Routes
//

// Read all users
app.get("/users", async (req, res) => {
    const allUsers = await users.find().toArray();
    res.json(allUsers);
});

// Create a new user
app.post("/users", async (req, res) => {
    const newUser = req.body;
    await users.insertOne(newUser);
    res.send("User added successfully.");
});

// Update a user
app.put("/users/:id", async (req, res) => {
    const id = req.params.id;
    const updatedUser = req.body;
    await users.updateOne({ id }, { $set: updatedUser });
    res.send("User updated successfully.");
});

// Delete a user
app.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    await users.deleteOne({ id });
    res.send("User deleted successfully.");
});

//
// ✅ Authentication Routes
//

// Redirect root to login
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Login form submission
app.post("/login", async (req, res: any) => {
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

// Index route
app.get("/index", secureMiddleware, (req, res) => {
    if (req.session.user) {
        res.render("index", {user: req.session.user});
    } else {
        res.redirect("/login");
    }
});

//
// ✅ Expense Routes
//

// Kosten Toevoegen - Toon formulier
app.get("/view-expenses", secureMiddleware, async (req, res) => {
    try {
        const filter = req.query.filter as string; // Haal de filter op uit query
        const search = req.query.search as string; // Haal de zoekterm op uit query

        let query: any = {}; // Basisquery

        // Filter op inkomsten/uitgaven
        if (filter === "true") {
            query.isIncoming = true;
        } else if (filter === "false") {
            query.isIncoming = false;
        }

        // Zoek op beschrijving (case-insensitive)
        if (search && search.trim() !== "") {
            query.description = { $regex: search.trim(), $options: "i" };
        }

        // Voer query uit
        const allExpenses = await expenses.find(query).toArray(); 
        // change this above to find expense for user from session user
        console.log("Filtered/Queried Expenses:", allExpenses);

        res.render("view-expenses", {
            expenses: allExpenses,
            filter: filter || "",
            search: search || ""
        });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Kosten Toevoegen - Verwerk formulier
app.post("/add-expense", isAuthenticated, async (req: any, res) => {
    const { isIncoming, description, amount, paymentMethod, cardDetails, bankAccountNumber, category, isPaid } = req.body;

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
        userId: req.session.id, // Koppel uitgave aan gebruiker
    };

    await expenses.insertOne(newExpense);
    console.log("Nieuwe uitgave toegevoegd:", newExpense);

    res.redirect("/view-expenses");
});

// Kosten Bekijken (met filter op isIncoming)
app.get("/view-expenses", secureMiddleware, async (req: any, res) => {
    try {
        const filter = req.query.filter as string;
        const search = req.query.search as string;

        let query: any = { userId: req.session.userId }; // Filter op de huidige gebruiker

        if (filter === "true") {
            query.isIncoming = true;
        } else if (filter === "false") {
            query.isIncoming = false;
        }

        if (search && search.trim() !== "") {
            query.description = { $regex: search.trim(), $options: "i" };
        }

        const userExpenses = await expenses.find(query).toArray();
        console.log("Gebruikerspecifieke Expenses:", userExpenses);

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


// Kosten Toevoegen - Toon formulier
app.get("/add-expense", secureMiddleware, (req, res) => {
    res.render("add-expense");
});

// Update een bestaande uitgave
app.post("/update-expense/:id", async (req, res) => {
    const id = req.params.id;
    const { description, amount, currency, date, category, isPaid, isIncoming } = req.body;

    try {
        await expenses.updateOne(
            { id },
            {
                $set: {
                    description,
                    amount: parseFloat(amount),
                    currency,
                    date: new Date(date).toISOString(),
                    category,
                    isPaid: isPaid === "true",
                    isIncoming: isIncoming === "true",
                }
            }
        );
        console.log(`Expense ${id} updated successfully.`);
        res.redirect("/view-expenses");
    } catch (error) {
        console.error("Error updating expense:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Verwijder een uitgave
app.get("/delete-expense/:id", async (req, res) => {
    const id = req.params.id;

    try {
        await expenses.deleteOne({ id });
        console.log(`Expense ${id} deleted successfully.`);
        res.redirect("/view-expenses");
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/logout", isAuthenticated, (req: Request, res: Response) => {
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

// ✅ Toon Registratiepagina
app.get("/register", (req, res) => {
    res.render("registerUser");
});

// ✅ Verwerk Registratieformulier
app.post("/register", async (req, res) => {
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



//
// ✅ Start Server
//

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get('port'));
});
