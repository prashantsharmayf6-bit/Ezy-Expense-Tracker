export type TransactionType = "income" | "expense";
export type PaymentType = "Cash" | "Card" | "UPI" | "Bank Transfer";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  paymentType: PaymentType;
}

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  categorySpending: { name: string; value: number; color: string }[];
  monthlyTrend: { month: string; income: number; expenses: number }[];
}
