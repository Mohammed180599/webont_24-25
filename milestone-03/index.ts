import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { User, Expense } from "./interfaces"; // Import interfaces
import { connect } from "./database";

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

// Simuleer een ingelogde gebruiker
const currentUser: User = {
    id: "12345",
    name: "John Doe",
    email: "john@example.com",
    budget: {
        monthlyLimit: 2000,
        notificationThreshold: 0.9,
        isActive: true,
    },
    expenses: [], // Expenses can be filled dynamically
};

// Simuleer uitgaven
const expenses: Expense[] = [
    {
        id: "1",
        description: "Pizza bestellen",
        amount: 25,
        date: "2024-12-01",
        currency: "EUR",
        paymentMethod: { method: "Cash" },
        isIncoming: false,
        category: "food",
        tags: ["pizza"],
        isPaid: true,
    },
    {
        id: "2",
        description: "Huur",
        amount: 800,
        date: "2024-12-01",
        currency: "EUR",
        paymentMethod: { method: "Bank Transfer", bankAccountNumber: "****1234" },
        isIncoming: false,
        category: "rent",
        tags: ["monthly"],
        isPaid: true,
    },
];

// Redirect root to login
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Login form submission
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Placeholder: Simpel validatievoorbeeld
    if (email === "user@ap.be" && password === "password") {
        res.redirect("/index");
    } else {
        res.status(400).send("Invalid mail adress or password");
    }
});

// Index route
app.get("/index", (req, res) => {
    // Render de index pagina met gebruikersinformatie
    res.render("index", { user: currentUser });
});

// Kosten Toevoegen - Toon formulier
app.get("/add-expense", (req, res) => {
    // Render de pagina voor het toevoegen van uitgaven
    res.render("add-expense");
});

// Kosten Toevoegen - Verwerk formulier
app.post("/add-expense", (req, res) => {
    const { isIncoming, description, amount, paymentMethod, cardDetails, bankAccountNumber, category, isPaid } = req.body;

    // Create a new expense object
    const newExpense: Expense = {
        id: (expenses.length + 1).toString(),
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
        isPaid: isPaid === "on", // Checkbox sends "on" if checked
    };

    expenses.push(newExpense);
    console.log("Nieuwe uitgave toegevoegd:", newExpense);

    // Redirect to the expenses view page
    res.redirect("/view-expenses");
});


// Kosten Bekijken
app.get("/view-expenses", (req, res) => {
    // Render de pagina om alle uitgaven te bekijken
    res.render("view-expenses", { expenses });
});

// Start de server
app.listen(app.get("port"), async() => {
    await connect();
    console.log("Server started on http://localhost:" + app.get('port'));
});