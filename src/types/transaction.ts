export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  date: string;
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionFormData = {
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  date: string;
  category?: string;
  notes?: string;
};
