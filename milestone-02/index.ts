import express, { Express } from "express";
import dotenv from "dotenv";
import path, { format } from "path";

dotenv.config();

const app : Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

app.get("/", async(req, res) => {
    // res.render("index"); deze code wordt later gebruikt
    res.redirect("/login");
});

app.get("/login", async(req, res) => {
    res.render("login");
});

app.post("/login", async(req, res) => {
    const { username, password } = req.body;
});

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get('port'));
});