export const APP_NAME = "Nirapod Bank";
export const CURRENCY = "BDT";

export const ROLES = ["ADMIN", "STAFF", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUS = ["ACTIVE", "INACTIVE", "BLOCKED"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const ACCOUNT_TYPES = ["SAVINGS", "CURRENT", "BUSINESS"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_STATUS = ["ACTIVE", "FROZEN", "CLOSED"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[number];

export const TXN_TYPES = ["DEPOSIT", "WITHDRAWAL", "TRANSFER", "LOAN_DISBURSEMENT", "LOAN_REPAYMENT"] as const;
export type TxnType = (typeof TXN_TYPES)[number];

export const TXN_STATUS = ["PENDING", "COMPLETED", "FAILED", "REVERSED"] as const;
export type TxnStatus = (typeof TXN_STATUS)[number];

export const REQUEST_TYPES = ["DEPOSIT", "WITHDRAWAL"] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUS = ["PENDING", "APPROVED", "REJECTED"] as const;
export type RequestStatus = (typeof REQUEST_STATUS)[number];

export const LOAN_TYPES = ["PERSONAL", "HOME", "AUTO", "EDUCATION", "BUSINESS"] as const;
export type LoanType = (typeof LOAN_TYPES)[number];

export const LOAN_STATUS = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED"] as const;
export type LoanStatus = (typeof LOAN_STATUS)[number];

export const EMPLOYMENT_STATUS = ["EMPLOYED", "SELF_EMPLOYED", "BUSINESS_OWNER", "UNEMPLOYED", "STUDENT", "RETIRED"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUS)[number];

export const NOTIFICATION_TYPES = [
  "MONEY_RECEIVED",
  "TRANSFER_COMPLETED",
  "DEPOSIT_APPROVED",
  "DEPOSIT_REJECTED",
  "WITHDRAWAL_APPROVED",
  "WITHDRAWAL_REJECTED",
  "LOAN_APPROVED",
  "LOAN_REJECTED",
  "LOAN_REPAID",
  "GENERAL",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  STAFF: "/staff",
  CUSTOMER: "/customer",
};

export const PAGE_SIZE = 10;

export const label = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
