export interface User {
    ObjectId?: string;
    id: string;
    name: string;
    email: string;
    password:string;
    expenses: Expense[];
    budget: Budget;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    currency: string;
    paymentMethod: PaymentMethod;
    isIncoming: boolean;
    category: string;
    tags: string[];
    isPaid: boolean;
    userId: string;
}

export interface Budget {
    monthlyLimit: number;
    notificationThreshold: number;
    isActive: boolean;
}

export interface PaymentMethod {
    method: string;
    cardDetails?: {
        number: string;
        expiry: string;
    };
    bankAccountNumber?: string;
}