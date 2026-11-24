import type {
  AccountStatus,
  AccountType,
  EmploymentStatus,
  LoanStatus,
  LoanType,
  NotificationType,
  RequestStatus,
  RequestType,
  Role,
  TxnStatus,
  TxnType,
  UserStatus,
} from "@/lib/constants";

export type ApiResponse<T> = { success: true; data: T };
export type ApiError = { success: false; message: string; code?: string; errors?: Record<string, string[]> };

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number; totalPages: number };

export interface UserSummary {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  nationalId?: string;
  role: Role;
  status: UserStatus;
  isVerified: boolean;
  createdAt: string;
}

export interface Account {
  _id: string;
  accountNumber: string;
  owner: string | Pick<UserSummary, "_id" | "name" | "email">;
  type: AccountType;
  balance: number;
  status: AccountStatus;
  dailyTransferLimit?: number | null;
  singleTransactionLimit?: number | null;
  minimumBalance?: number | null;
  createdAt: string;
}

type AccountRef = Pick<Account, "_id" | "accountNumber" | "type"> | null;

export interface Transaction {
  _id: string;
  txnId: string;
  type: TxnType;
  fromAccount?: AccountRef;
  toAccount?: AccountRef;
  amount: number;
  fee: number;
  status: TxnStatus;
  description?: string;
  flagged: boolean;
  flagReason?: string;
  createdAt: string;
}

export interface FundRequest {
  _id: string;
  account: AccountRef;
  customer: string | Pick<UserSummary, "_id" | "name" | "email">;
  type: RequestType;
  amount: number;
  description?: string;
  status: RequestStatus;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ScheduleItem {
  installmentNo: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidAt?: string;
}

export interface Loan {
  _id: string;
  customer: string | Pick<UserSummary, "_id" | "name" | "email">;
  account: AccountRef;
  loanType: LoanType;
  amount: number;
  durationMonths: number;
  interestRate: number;
  monthlyIncome: number;
  employmentStatus: EmploymentStatus;
  description?: string;
  status: LoanStatus;
  emiAmount?: number;
  totalPayable?: number;
  remainingBalance?: number;
  schedule: ScheduleItem[];
  statusHistory: { status: LoanStatus; at: string; note?: string }[];
  createdAt: string;
}

export interface LoanNote {
  _id: string;
  author: Pick<UserSummary, "_id" | "name" | "role">;
  note: string;
  createdAt: string;
}

export interface LoanRepayment {
  _id: string;
  amount: number;
  installmentNo: number;
  paidAt: string;
}

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface BankSettings {
  dailyTransferLimit: number;
  maxSingleTransaction: number;
  minimumBalance: number;
  transferFeeBps: number;
  loanInterestRate: number;
  largeTransactionThreshold: number;
  velocityLimit: number;
}

export interface AdminAnalytics {
  totals: {
    customers: number;
    accounts: number;
    totalBalance: number;
    deposits: number;
    withdrawals: number;
    transactions: number;
    pendingLoans: number;
  };
  monthly: { month: string; deposit: number; withdrawal: number; transfer: number; loan: number; count: number }[];
  accountDistribution: { type: AccountType; count: number; balance: number }[];
  loanStats: { status: LoanStatus; count: number; amount: number }[];
}

export interface CustomerAnalytics {
  totals: { balance: number; deposits: number; withdrawals: number; received: number; spent: number };
  monthly: { month: string; spending: number; deposits: number; received: number }[];
  distribution: { type: TxnType; count: number; amount: number }[];
  recent: Transaction[];
  activeLoans: { _id: string; loanType: LoanType; amount: number; remainingBalance: number; emiAmount: number; nextDue?: string }[];
}
