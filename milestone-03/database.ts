import { Collection, MongoClient } from "mongodb";
import { Expense, User } from "./interfaces";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import data from "./data.json";

dotenv.config();

const uri : string = process.env.URI ?? "mongodb://localhost:27017";

export const client = new MongoClient(uri);
export const users: Collection = client.db("milestone_3").collection("users");
export const expenses: Collection = client.db("milestone_3").collection("expenses");

async function exit() {
    try {
        await client.close();
        console.log('Disconnected from database');
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}


export async function seedDatabase() {
    const existingUsers = await users.countDocuments();
    if (existingUsers === 0) {
        console.log("Seeding the database...");

        for (const user of data) {
            const { expenses: userExpenses, password, ...userData } = user;

            // Hash het wachtwoord voordat je de gebruiker opslaat
            const hashedPassword = await bcrypt.hash(password, 10);

            // Voeg het gehashte wachtwoord toe aan de gebruikersdata
            const userWithHashedPassword = {
                ...userData,
                password: hashedPassword,
            };

            // Insert user data
            await users.insertOne(userWithHashedPassword);

            // Insert user's expenses
            if (userExpenses && userExpenses.length > 0) {
                const expensesWithUserId = userExpenses.map((expense: Expense) => ({
                    ...expense,
                    userId: userData.id,
                }));
                await expenses.insertMany(expensesWithUserId);
            }
        }

        console.log("Database seeded successfully.");
    } else {
        console.log("Database already has data. Skipping seed.");
    }
}

export async function connect() {
    try {
        await client.connect();
        console.log('Connected to database');
        await seedDatabase();
        process.on('SIGINT', exit);
    } catch (error) {
        console.error(error);
    }
}

export async function login(email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email en wachtwoord zijn vereist.");
    }

    const user = await expenses.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password!))) {
        return user;
    }
    throw new Error("Ongeldig e-mailadres of wachtwoord.");
}
