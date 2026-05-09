export type Category = { id: string; name: string; color: string };

export type Card = {
  id: string;
  name: string;
  lastFourDigits: string | null;
  color: string;
  closingDayType: "FIXED" | "RELATIVE";
  closingDay: number;
};

export type PaymentMethod =
  | "CASH"
  | "DEBIT"
  | "CREDIT_CARD"
  | "PIX"
  | "TRANSFER";

export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  date: string;
  categoryId: string | null;
  category: { name: string; color: string } | null;
  notes: string | null;
  paymentMethod: PaymentMethod | null;
  cardId: string | null;
  card: { name: string; color: string; lastFourDigits: string | null } | null;
  installments: number;
  isRecurring: boolean;
  recurringEndDate: string | null;
  recurringParentId: string | null;
  recurringExceptionMonth: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Virtual entry: one per installment month or recurring month, derived from a single Transaction */
export type TransactionView = Transaction & {
  installmentIndex: number;
  virtualDate: string;      // "YYYY-MM-DD" for the month this entry belongs to
  displayAmount: number;    // amount / installments (or amount for recurring)
  recurringMonth?: string;  // "YYYY-MM" — only for recurring views
  exceptionId?: string;     // id of the active exception record for this month, if any
};

export type TransactionFormData = {
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
  date: string;
  categoryId?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  cardId?: string;
  installments?: number;
  isRecurring?: boolean;
};
