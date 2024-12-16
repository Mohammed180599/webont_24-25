import { Collection, MongoClient } from "mongodb";
import { Expense, User } from "./interfaces";
import dotenv from "dotenv";

dotenv.config();
const uri : string = process.env.URI ?? "mongodb://localhost:27017";

export const client = new MongoClient(uri);
export const users: Collection<User> = client.db("budgetlens").collection<User>("users");
// export const expenses: Collection<Expense> = client.db("budgetlens").collection<Expense>("expenses");

async function exit() {
    try {
        await client.close();
        console.log('Disconnected from database');
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

export async function connect() {
    try {
        await client.connect();
        console.log('Connected to database');
        process.on('SIGINT', exit);
    } catch (error) {
        console.error(error);
    }
}