import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import { User, Expense } from "./interfaces"; // Import interfaces
import { connect, users, expenses } from "./database";
import sessionMiddleware from "./sessions";
import { isAuthenticated, isNotAuthenticated, secureMiddleware } from "./authMiddleware";
import data from "./data.json";
import { loginRouter } from "./routes/loginRouter";
import { expenseRouter } from "./routes/expenseRouter";
import { registerRouter } from "./routes/registerRouter";
import { userRouter } from "./routes/userRouter";


dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(loginRouter());
app.use(expenseRouter());
app.use(registerRouter());
app.use(userRouter());

app.use((req, res, next) => {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        req.user = req.session.user;
    } else {
        res.locals.user = null;
        req.user = undefined;
    }
    next();
});



app.set("views", path.join(__dirname, "views"));
app.set("port", process.env.PORT || 3000); // 

// root moet naar login
app.get("/", (req, res) => {
    res.redirect("/login");
});

// Index route
app.get("/index", secureMiddleware, async (req, res: any) => {
    if (!req.user || !req.user.id) {
        return res.redirect("/login");
    }

    try {
        // user uit database halen
        const fullUser = await users.findOne({ id: req.user.id });
        
        if (!fullUser) {
            return res.status(404).send("Gebruiker niet gevonden.");
        }

        res.render("index", { user: fullUser });
    } catch (error) {
        console.error("Fout bij ophalen van gebruiker:", error);
        res.status(500).send("Interne serverfout bij ophalen van gebruikersgegevens.");
    }
});

// server starten

app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get('port'));
});