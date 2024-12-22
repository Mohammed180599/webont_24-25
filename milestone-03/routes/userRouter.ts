import express, { Express, Request, Response } from "express";
import { isNotAuthenticated, secureMiddleware } from "../authMiddleware";
import { expenses, users } from "../database";
import bcrypt from "bcrypt";
import { Expense, User } from "../interfaces";

export function userRouter() {
    const router = express.Router();


// Read alle users
router.get("/users", async (req, res) => {
    const allUsers = await users.find().toArray();
    res.json(allUsers);
});

// Maak een nieuwe user aan
router.post("/users", async (req, res) => {
    const newUser = req.body;
    await users.insertOne(newUser);
    res.send("User added successfully.");
});

// Update een user
router.put("/users/:id", async (req, res) => {
    const id = req.params.id;
    const updatedUser = req.body;
    await users.updateOne({ id }, { $set: updatedUser });
    res.send("User updated successfully.");
});

// verwijderen van een user
router.delete("/users/:id", async (req, res) => {
    const id = req.params.id;
    await users.deleteOne({ id });
    res.send("User deleted successfully.");
});

return router;
}