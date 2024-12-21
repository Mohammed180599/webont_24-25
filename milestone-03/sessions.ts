import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import dotenv from "dotenv";
import { User } from "./interfaces";

dotenv.config();

const MongoDBSessionStore = MongoDBStore(session);

const uri = process.env.URI || "mongodb://localhost:27017";

declare module "express-session" {
    export interface SessionData {
        user: User
    }
}

export default session({
    secret: process.env.SESSION_SECRET || "geheimesleutel",
    resave: true,
    saveUninitialized: true,
    store: new MongoDBSessionStore({
        uri: uri,
        collection: "sessions",
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 dag
        httpOnly: true,
        secure: false, // Zet op 'true' bij HTTPS
    },
});