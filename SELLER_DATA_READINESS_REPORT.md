# Seller Portal Data Readiness & Diagnostic Report

**Project**: To Be Take (Full-Stack Monorepo)  
**Date**: October 3, 2026  
**Status**: Ready for Manual QA  

---

## 1. Database Configuration & Connection Targets

| Component | Target URL / Connection String | Host | Port | Database Name | Schema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Prisma CLI / Seed** | `postgresql://postgres:****@localhost:5432/to_be_take_dev?schema=public` | `localhost` | `5432` | `to_be_take_dev` | `public` |
| **Backend API** | `postgresql://postgres:****@localhost:5432/to_be_take_dev?schema=public` | `localhost` | `5432` | `to_be_take_dev` | `public` |
| **Web Application** | `http://localhost:4000/api` (proxied via `/api/*`) | `localhost` | `3000` | N/A | N/A |

- **Database Engine**: PostgreSQL (`postgresql-x64-18` Windows Service)
- **Status**: Running and reachable.
- **Connection Parity**: Verified that Prisma CLI, database package, and NestJS API connect to the exact same database (`to_be_take_dev`).

---

## 2. Database Entity Record Counts

Safe, non-destructive diagnostic query of all 23 database models:

| Prisma Model / Entity | Record Count | Description |
| :--- | :---: | :--- |
| `UserRole` | **4** | Super Admin, Admin, Seller/Vendor, Buyer/Customer |
| `Permission` | **37** | Granular RBAC permissions |
| `RolePermission` | **68** | Role-permission mappings |
| `Department` | **11** | Internal departments |
| `User` | **43** | All users across all roles |
| `User (Vendor / Seller)` | **14** | Active and seeded seller accounts |
| `SellerApproval` | **13** | Seller onboarding / approval history |
| `Category` | **10** | Active product categories |
| `Product` | **22** | Marketplace products |
| `InventoryItem` | **22** | Stock tracking records |
| `InventoryLog` | **21** | Stock change audit logs |
| `Order` | **12** | Marketplace customer orders |
| `OrderItem` | **12** | Line items per order |
| `OrderStatusHistory` | **10** | Order state transition audit entries |
| `Payment` | **10** | Transaction / payment records |
| `CommissionRecord` | **10** | Platform fee & seller commission calculations |
| `SellerPayout` | **6** | Merchant payout settlements |
| `OrderReturn` | **4** | Return requests and refunds |
| `Shipment` | **10** | Shipping & tracking records |
| `ProductReview` | **7** | Customer product ratings & reviews |
| `AdminNotification` | **8** | Platform & merchant notifications |
| `AuditLog` | **146** | Security and administration audit entries |
| `PlatformSetting` | **11** | Global marketplace settings |
| `UserSession` | **4** | Active sessions |

---

## 3. Seed Status & Idempotence

- **Existing Seed Script**: [`packages/database/prisma/seed.ts`](file:///e:/ToBeTake/packages/database/prisma/seed.ts)
- **Seed Design**: Fully idempotent using `upsert` and `findFirst` checks.
- **Execution Decision**: **Not re-executed**. The development database already contains the complete demo dataset intact without data loss or corruption. Resetting or blindly reseeding was avoided to preserve existing test records.

---

## 4. QA Test Accounts Verification

| Account Role | Identifier | Seeded Password | DB Role Code | Account Status | API Authentication Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Seller** | `contact@apextech.com` | `DevDemo@2026!` | `VENDOR` | `ACTIVE` | **HTTP 200 OK** (Login successful) |
| **Admin** | `admin_sarah` | `DevDemo@2026!` | `ADMIN` | `ACTIVE` | **HTTP 200 OK** (Login successful) |
| **Super Admin** | `superadmin` | `SuperAdmin@2026!` | `SPADMIN` | `ACTIVE` | **HTTP 200 OK** (Login successful) |
| **Customer** | `olivia.chen@example.com` | `DevDemo@2026!` | `CUST` | `ACTIVE` | **HTTP 200 OK** (Login successful) |

---

## 5. Seller API Endpoints Verification (`contact@apextech.com`)

All 12 seller endpoints were called against the running NestJS API (`http://localhost:4000/api`) with authenticated seller credentials (ID: `794dccee-5dda-455f-889f-9318d748842b`):

| Endpoint | Method | Status | Live Data Returned |
| :--- | :---: | :---: | :--- |
| `/api/seller/dashboard` | `GET` | **200 OK** | Gross: `$538.98`, Net: `$395.08`, Orders: `5`, Active Prods: `3`, Recent Orders: `5`, Top Prods: `5` |
| `/api/seller/products` | `GET` | **200 OK** | `8` products owned by Apex Tech (Headphones, Sensor, Earbuds, etc.) |
| `/api/seller/inventory` | `GET` | **200 OK** | `8` inventory records (Stock levels: `88`, `45`, `40`, `25`, all `IN_STOCK`) |
| `/api/seller/orders` | `GET` | **200 OK** | `5` orders (`ORD-DEL-...`, `ORD-1007`, `ORD-1005`, `ORD-1002`) |
| `/api/seller/shipping` | `GET` | **200 OK** | `3` shipments (`DHL-QA-9988776655`, `FDX-1122334455`, `UPS-4433221100`) |
| `/api/seller/finance/earnings` | `GET` | **200 OK** | Gross: `$438.98`, Net: `$395.08`, Platform Fees: `$43.90`, `3` transactions |
| `/api/seller/finance/commissions` | `GET` | **200 OK** | `3` commission records |
| `/api/seller/finance/payouts` | `GET` | **200 OK** | `1` payout record (`PO-2026-002` for `$116.99`) |
| `/api/seller/returns` | `GET` | **200 OK** | `1` return record (`RET-1004` for `$129.99`) |
| `/api/seller/reviews` | `GET` | **200 OK** | `2` customer reviews (`5/5` star ratings) |
| `/api/seller/notifications` | `GET` | **200 OK** | `8` notifications |
| `/api/seller/profile` | `GET` | **200 OK** | Store: `Apex Electronics & Tech Innovations`, Category: `Electronics & Gadgets` |

---

## 6. Seller Web Pages Verification

| Page Route | Expected UI Content | Data Availability |
| :--- | :--- | :--- |
| `/login/seller` | Seller login form with split layout & botanical art | Ready |
| `/seller/dashboard` | Sales KPIs, revenue metrics, recent orders table, top products | **Available** (`$538.98` total sales, 5 orders) |
| `/seller/products` | Product catalog table with pricing, status, action buttons | **Available** (8 products) |
| `/seller/inventory` | Inventory table with SKU, stock quantity, stock status | **Available** (8 items, stock up to 88) |
| `/seller/orders` | Order management table with amounts, customer details, status | **Available** (5 orders) |
| `/seller/shipping` | Shipping fulfillment table with carriers and tracking IDs | **Available** (3 shipments) |
| `/seller/earnings` | Financial summary cards and earnings transaction ledger | **Available** ($438.98 gross, $395.08 net) |
| `/seller/commissions` | Commission ledger breakdown | **Available** (3 records) |
| `/seller/payouts` | Payout history table with payout number and amount | **Available** (`PO-2026-002`) |
| `/seller/returns` | Return requests table with refund amounts and status | **Available** (`RET-1004`) |
| `/seller/reviews` | Customer ratings, reviews, and comments | **Available** (2 reviews, 5/5 stars) |
| `/seller/notifications` | Notification alerts feed | **Available** (8 notifications) |
| `/seller/profile` | Store name, contact email, business category | **Available** (Apex Electronics) |

---

## 7. Diagnostics & Observations

1. **Why dummy data appeared "missing" on direct page visits**:
   - The seller portal routes (`/seller/*`) are client-side protected. They retrieve the logged-in user's credentials and token from `sessionStorage.getItem('tobetake_auth_user')`.
   - When visiting `/seller/dashboard` directly in a fresh browser session without first signing in via `/login/seller`, `sessionStorage` is empty, which correctly prompts the user to sign in rather than loading dummy data unauthenticated.
   - Once the user logs in at `http://localhost:3000/login/seller` with `contact@apextech.com` / `DevDemo@2026!`, the session is initialized, and all pages immediately display their corresponding seeded dummy data.

2. **Remaining Empty Entities**:
   - **None**. Every section of the seller portal has live seeded records.

3. **Environment Alignment**:
   - Backend API: `http://localhost:4000/api` (Running)
   - Frontend Web: `http://localhost:3000` (Running)
   - Database: `to_be_take_dev` on PostgreSQL port 5432 (Connected)
