import * as fs from 'fs';
import * as readlineSync from 'readline-sync';
import { User, Expense, PaymentMethod } from './interfaces';

const dbFilePath = './database.json';

// 
function loadDatabase(): User[] {
    const data = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(data);
}

function saveDatabase(users: User[]): void {
    fs.writeFileSync(dbFilePath, JSON.stringify(users, null, 2));
}

function addExpense(user: User): void {
    const id = Date.now().toString();
    const description = readlineSync.question('Voer een beschrijving van de uitgave in: ');
    const amount = parseFloat(readlineSync.question('Voer het bedrag van de uitgave in: '));
    const date = new Date().toISOString();
    const currency = readlineSync.question('Voer de valuta in (bijv. USD, EUR): ');

    const paymentMethod: PaymentMethod = {
        method: readlineSync.question('Voer de betaalmethode in (Credit Card, Bank Transfer, Cash, PayPal): '),
    };

    if (paymentMethod.method === 'Credit Card') {
        paymentMethod.cardDetails = {
            number: readlineSync.question('Voer het creditcardnummer in (masked): '),
            expiry: readlineSync.question('Voer de vervaldatum van de kaart in (masked): ')
        };
    } else if (paymentMethod.method === 'Bank Transfer') {
        paymentMethod.bankAccountNumber = readlineSync.question('Voer het bankrekeningnummer in: ');
    }

    const isIncoming = readlineSync.question('Is dit een uitgave? (ja/nee): ').toLowerCase() === 'ja';
    const category = readlineSync.question('Voer de categorie in (bijv. voedsel, drank, huur): ');
    const tags = readlineSync.question('Voer eigenschappen toe (komma gescheiden): ').split(',');

    const expense: Expense = {
        id,
        description,
        amount,
        date,
        currency,
        paymentMethod,
        isIncoming,
        category,
        tags,
        isPaid: true,
    };

    user.expenses.push(expense);
    saveDatabase(loadDatabase().map(u => u.id === user.id ? user : u));
    console.log('Uitgave succesvol toegevoegd.');
}

function viewExpenses(user: User): void {
    if (user.expenses.length === 0) {
        console.log('Geen uitgaven gevonden.');
        return;
    }

    user.expenses.forEach(expense => {
        console.log(`\nID: ${expense.id}`);
        console.log(`Beschrijving: ${expense.description}`);
        console.log(`Bedrag: ${expense.amount} ${expense.currency}`);
        console.log(`Datum: ${expense.date}`);
        console.log(`Betaalmethode: ${expense.paymentMethod.method}`);
        console.log(`Categorie: ${expense.category}`);
        console.log(`Labels: ${expense.tags.join(', ')}`);
        console.log(`Betaald: ${expense.isPaid ? 'Ja' : 'Nee'}`);
        console.log(`Inkomsten: ${expense.isIncoming ? 'Ja' : 'Nee'}`);
    });
}

function main() {
    const users = loadDatabase();
    const userId = readlineSync.question('Voer je gebruikers-ID in: ');
    const user = users.find(u => u.id === userId);

    if (!user) {
        console.log('Gebruiker niet gevonden.');
        return;
    }

    const action = readlineSync.question('Wil je een uitgave toevoegen of je uitgaven bekijken? (toevoegen/bekijken): ');

    if (action.toLowerCase() === 'toevoegen') {
        addExpense(user);
    } else if (action.toLowerCase() === 'bekijken') {
        viewExpenses(user);
    } else {
        console.log('Ongeldige actie.');
    }
}

main();