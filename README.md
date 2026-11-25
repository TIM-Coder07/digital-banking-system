# Digital Banking Management System

A simulated digital banking platform built with Next.js App Router, TypeScript, Redux Toolkit, RTK Query, MongoDB and NextAuth. No real money, cards or banking credentials are used.

- **Live:** https://digital-banking-system.vercel.app
- **Repo:** https://github.com/TIM-Coder07/digital-banking-system

## Demo Credentials

| Role | Email | Password | Transaction PIN |
|---|---|---|---|
| Admin | admin@bank.test | Admin@1234 | n/a |
| Bank Staff | staff@bank.test | Staff@1234 | n/a |
| Customer | rahim@bank.test | Customer@1234 | 1234 |
| Customer | karim@bank.test | Customer@1234 | 1234 |

Run `npm run seed` to create them.

## Application Features

- Three roles (Admin, Staff, Customer) with server side authorization on every API route
- Multiple accounts per customer (Savings, Current, Business) with an account switcher
- Atomic fund transfers (own accounts and other customers) with PIN, limits, fee and idempotency
- Deposit and withdrawal requests with a staff/admin approval workflow
- Loan applications, staff notes and forwarding, admin approval, recorded disbursement, EMI schedule and repayments
- Transaction history with search by ID, type and date filters, pagination and PDF receipts
- CSV account statements
- Admin configurable limits (daily transfer, single transaction, minimum balance, fee)
- Rule based suspicious transaction flagging
- Notifications, dark mode, responsive layout

## User Roles & Permissions

| Action | Admin | Staff | Customer |
|---|---|---|---|
| Analytics dashboard | ✓ | | own only |
| Register customers / open accounts | ✓ | ✓ | |
| Verify customers | ✓ | ✓ | |
| Activate, deactivate, block customers | ✓ | | |
| Freeze accounts, set limits, bank settings | ✓ | | |
| View all transactions, flag suspicious | ✓ | ✓ | own only |
| Approve deposit/withdrawal requests | ✓ | ✓ (never their own) | |
| Add loan notes, forward loans | ✓ | ✓ (never their own) | |
| Approve/reject loans | ✓ (never their own) | | |
| Transfer, request deposit/withdrawal, apply/repay loan | | | ✓ |

## Redux Toolkit Architecture

```
src/store/
  index.ts            configureStore (api reducer + feature slices + api middleware)
  hooks.ts            typed useAppDispatch / useAppSelector
  api/baseApi.ts      single createApi, tagTypes, endpoints injected per feature
  features/
    auth/             authSlice (session user), authApi (PIN)
    accounts/         accountSlice (selected account), accountApi
    transactions/     transactionSlice (filters), transactionApi (list, detail, transfer, flag)
    loans/            loanSlice (selected loan), loanApi
    requests/         requestApi
    customers/        customerApi
    analytics/        analyticsApi
    notifications/    notificationApi
    settings/         settingsApi
    ui/               uiSlice: centralized loading (isPending/isFulfilled/isRejected matchers), last error, sidebar
```

## RTK Query Implementation

- One `baseApi` with `fetchBaseQuery({ baseUrl: "/api" })`; every feature calls `baseApi.injectEndpoints`.
- Tags: `Account`, `Transaction`, `Request`, `Loan`, `Customer`, `Analytics`, `Notification`, `Settings`.
- Mutations invalidate the tags they affect (a transfer invalidates `Account`, `Transaction`, `Analytics`, `Notification`) so balances and charts refresh automatically.
- The transfer mutation sends an `Idempotency-Key` header generated once per confirmed transfer.

## Authentication Strategy

- NextAuth Credentials provider, JWT sessions (8 hours), bcrypt password hashes.
- `src/middleware.ts` redirects users away from role areas they do not own.
- Every API route calls `requireAuth` / `requireRole` from `src/server/auth/guard.ts`, which re-reads the user from the database so blocked users lose access immediately even with a valid token.
- Transaction PIN is bcrypt hashed, locked for 15 minutes after 5 wrong attempts.

## Transaction Processing Logic

Money is stored as integer **paisa** (1 BDT = 100) to avoid floating point errors.

Fund transfer (`src/server/services/transfer.service.ts`):
1. Reject replays: same `Idempotency-Key` returns the original transaction.
2. Verify the PIN.
3. Start a MongoDB session and `withTransaction`:
   - load source account **filtered by owner** (ownership check) and recipient account
   - check both are ACTIVE, not the same account, recipient owner active
   - apply single transaction limit, daily limit (sum of today's transfers) and minimum balance
   - debit with a conditional update `{ balance: { $gte: amount + fee + minBalance } }` so two parallel transfers can never overdraw
   - credit recipient, write one Transaction document referencing both accounts, store the idempotency key, create notifications
4. Any error aborts the whole transaction, so money is never removed from only one side.
5. After commit, rule based fraud checks may flag the transaction for review.

Deposit/withdrawal approval and loan disbursement/repayment follow the same session pattern, and the request/loan status change is a conditional update (`status: "PENDING"`), so a request can never be approved twice.

## Database Structure

| Collection | Key fields |
|---|---|
| users | name, email, passwordHash, pinHash, role, status, isVerified |
| accounts | accountNumber (12 digits, unique), owner, type, balance (paisa), status, per account limits |
| transactions | txnId (unique), type, fromAccount, toAccount, amount, fee, status, balance after, flagged |
| fundrequests | account, customer, type, amount, status, reviewedBy, transaction |
| loans | customer, account, type, amount, duration, rate, status, EMI, schedule[], statusHistory[] |
| loanrepayments | loan, account, amount, transaction, installmentNo |
| loannotes | loan, author, note |
| notifications | user, type, title, message, read |
| idempotencykeys | user, key (unique per user), transaction, TTL 24h |
| banksettings | dailyTransferLimit, maxSingleTransaction, minimumBalance, transferFeeBps, loanInterestRate, fraud thresholds |

Transactions are never deleted or edited by any API; corrections would use a REVERSED status and a new transaction.

## Security Implementation

- Server side balance validation, frontend balances are never trusted
- Amount validated with Zod on client and server, converted to paisa on the server
- Account ownership enforced in queries (`{ _id, owner: user.id }`)
- Staff cannot approve their own requests or forward their own loans; admin cannot approve their own loan
- Idempotency keys prevent duplicate transfers
- Errors return consistent JSON `{ success, message }` without stack traces

## Environment Variables

| Name | Description |
|---|---|
| MONGODB_URI | MongoDB Atlas connection string (must be a replica set for transactions) |
| NEXTAUTH_SECRET | Random secret for JWT signing |
| NEXTAUTH_URL | Base URL of the app |

## Local Setup

```bash
npm install
cp .env.example .env.local   # fill in values
npm run seed
npm run dev
```

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your Vercel URL).
3. In MongoDB Atlas, allow network access from `0.0.0.0/0` (or Vercel IPs).
4. Deploy, then run `npm run seed` locally against the production database.

## Additional Libraries

mongoose, bcryptjs, zod, react-hook-form, @hookform/resolvers, jspdf (PDF receipts), lucide-react (icons), next-themes (dark mode), sonner (toasts), clsx, tailwind-merge.


## Demo Credentials

| Role | Name | Email | Password | Transaction PIN | Notes |
|---|---|---|---|---|---|
| Admin | Ayesha Rahman | admin@bank.test | Admin@1234 | n/a | Full access: analytics, loan approval, freeze accounts, bank settings |
| Bank Staff | Tanvir Hossain | staff@bank.test | Staff@1234 | n/a | Register and verify customers, approve requests, forward loans |
| Customer | Rahim Uddin | rahim@bank.test | Customer@1234 | 1234 | Savings + Current account, has an active personal loan |
| Customer | Karim Ahmed | karim@bank.test | Customer@1234 | 1234 | Savings + Business account, has a pending business loan |
| Customer | Nusrat Jahan | nusrat@bank.test | Customer@1234 | not set | Unverified, no accounts (use to test staff KYC flow) |

### Suggested Test Flow

1. **Customer (Rahim):** transfer money to Karim's account, download the PDF receipt, submit a deposit request
2. **Staff:** approve Rahim's deposit, verify Nusrat and open her an account, forward Karim's loan
3. **Admin:** approve Karim's loan (money is disbursed), check the dashboard charts, review flagged transactions
