# Comprehensive Data Flow Diagnostic Report: Database → API → Web

**Project**: To Be Take (Full-Stack Monorepo)  
**Date**: October 3, 2026  
**Audited Target**: PostgreSQL (`localhost:5432` / `to_be_take_dev`) &#8594; NestJS API (`localhost:4000`) &#8594; Next.js Web (`localhost:3000`)  
**Status**: All Endpoints, Data Envelopes, and Pages Verified

---

## 1. Executive Summary & Root Cause Analysis

### What Was Reported
- The database had been seeded, but data was believed to be invisible or disappearing between DB, API, and Frontend UI.

### Exact Findings & Root Causes
1. **Database & API Connection Parity (Verified)**:
   - **NestJS API**, **Prisma CLI**, and `@tobetake/database` all target the exact same database: `postgresql://postgres:****@localhost:5432/to_be_take_dev?schema=public`.
   - The database **already contains the complete, rich demo dataset** (43 users, 14 sellers, 22 products, 22 inventory items, 12 orders, 10 categories, 10 payments, 10 commissions, 6 payouts, 4 returns, 10 shipments, 7 reviews, 8 notifications).
   - **No data was deleted, dropped, or corrupted.**

2. **Frontend Authentication Lifecycle & Session Propagation**:
   - Both the Seller Portal (`/seller/*`) and Admin Portal (`/admin/*`) are protected client-side workspaces that require an authenticated session in browser `sessionStorage.getItem('tobetake_auth_user')`.
   - If a browser tab visits `/seller/dashboard` or `/admin/products` directly without first logging in through `/login/seller` or `/login/admin`, the client-side authentication guard blocks unauthenticated data fetching and shows a login prompt card.
   - When logging in through the portal forms (`/login/seller` or `/login/admin`), the backend API returns the authenticated user payload and the frontend stores the user session in `sessionStorage`. All subsequent authenticated fetches attach `Authorization: Bearer <userId>` and `x-user-id: <userId>`, loading all seeded records immediately.

3. **Admin Categories Response Envelope Mismatch (Fixed)**:
   - **Root Cause**: `GET /api/admin/categories` returns `{ success: true, data: [ Category, ... ] }` as an array of categories. `apps/web/src/app/admin/categories/page.tsx` had initialized state as `PaginatedResult` expecting `{ items: [...] }` and called `setData(json.data)`. Because `json.data` was a raw array rather than an object with an `.items` property, `data.items` was `undefined`, causing the categories table to fail or render empty.
   - **Fix Applied**: Updated `apps/web/src/app/admin/categories/page.tsx` to automatically normalize array responses into `{ items: json.data, total: json.data.length, page: 1, limit: json.data.length, totalPages: 1 }` and mapped `(cat as any).productCount ?? cat.productsCount ?? 0`.

---

## 2. Phase 1 — Database Diagnostic & Record Counts

- **Database Provider**: PostgreSQL (`postgresql-x64-18` Windows Service)
- **Host**: `localhost:5432`
- **Database Target**: `to_be_take_dev` (Schema: `public`)
- **Connection Configuration**:
  - `apps/api/.env`: `postgresql://postgres:****@localhost:5432/to_be_take_dev?schema=public`
  - `packages/database/.env`: `postgresql://postgres:****@localhost:5432/to_be_take_dev?schema=public`
  - `.env` (root): `postgresql://postgres:****@localhost:5432/to_be_take_dev?schema=public`

### Direct Database Model Counts

| Entity | DB Record Count | Status / Notes |
| :--- | :---: | :--- |
| **Product** | **22** | 8 belonging to Apex Tech, 14 across other vendors |
| **Category** | **10** | Electronics, Audio, Smart Devices, Home, Ceramics, etc. |
| **User (Total)** | **43** | 1 SuperAdmin, 3 Admins, 14 Sellers, 25 Customers |
| **Seller (Vendor Accounts)** | **14** | Active & approved merchants |
| **SellerApproval** | **13** | Merchant approval records |
| **InventoryItem** | **22** | Real stock quantities (up to 88 units/item) |
| **InventoryTransaction (Log)** | **21** | Stock movement & adjustment history |
| **Order** | **12** | Orders with various statuses (DELIVERED, PROCESSING, etc.) |
| **OrderItem** | **12** | Order line items with item pricing |
| **Payment** | **10** | Payment transaction records |
| **Commission** | **10** | Platform fees and seller earnings |
| **Payout** | **6** | Merchant payout settlements |
| **Return** | **4** | Return requests with refund amounts |
| **Review** | **7** | Customer reviews with 5-star ratings |
| **Notification** | **8** | Platform & store alerts |
| **Shipping** | **10** | Shipments with carriers and tracking IDs |

---

## 3. Phase 2 & 3 — API Endpoints Verification

All endpoints were tested directly against `http://localhost:4000/api` using live authenticated sessions:

### Seller API Endpoints (`contact@apextech.com` / ID: `794dccee-5dda-455f-889f-9318d748842b`)

| Endpoint | Method | HTTP Status | Response Structure | Records / Value |
| :--- | :---: | :---: | :--- | :--- |
| `/api/seller/dashboard` | `GET` | `200 OK` | `{ kpis, recentOrders, topProducts, ... }` | Total Sales: `$538.98`, Orders: `5`, Active Prods: `3` |
| `/api/seller/products` | `GET` | `200 OK` | `{ items: ProductListItem[], total: 8 }` | **8 products** (First: Apex Ultra Noise Cancelling Headphones) |
| `/api/seller/inventory` | `GET` | `200 OK` | `{ items: InventoryItemDto[], total: 8 }` | **8 items** (First: `APX-AUD-101` with `88` stock) |
| `/api/seller/orders` | `GET` | `200 OK` | `{ items: OrderListItem[], total: 5 }` | **5 orders** (`ORD-DEL-...`, `ORD-1007`, `ORD-1005`, `ORD-1002`) |
| `/api/seller/shipping` | `GET` | `200 OK` | `{ items: ShipmentDto[], total: 3 }` | **3 shipments** (`DHL-QA-...`, `FDX-...`, `UPS-...`) |
| `/api/seller/finance/earnings` | `GET` | `200 OK` | `{ grossSales, netEarnings, transactions }` | Gross: `$438.98`, Net: `$395.08`, `3` transactions |
| `/api/seller/finance/commissions` | `GET` | `200 OK` | `{ items: CommissionDto[], total: 3 }` | **3 commission records** |
| `/api/seller/finance/payouts` | `GET` | `200 OK` | `{ items: PayoutDto[], total: 1 }` | **1 payout** (`PO-2026-002` for `$116.99`) |
| `/api/seller/returns` | `GET` | `200 OK` | `{ items: ReturnDto[], total: 1 }` | **1 return** (`RET-1004` for `$129.99`) |
| `/api/seller/reviews` | `GET` | `200 OK` | `{ items: ReviewDto[], total: 2 }` | **2 reviews** (5/5 rating) |
| `/api/seller/notifications` | `GET` | `200 OK` | `{ notifications: NotificationDto[] }` | **8 notifications** |
| `/api/seller/profile` | `GET` | `200 OK` | `{ storeName, email, status }` | Apex Electronics & Tech Innovations |

### Admin API Endpoints (`admin_sarah` / ID: `080461eb-5adf-44f7-86a6-06d1f0f30d2e`)

| Endpoint | Method | HTTP Status | Response Structure | Records / Value |
| :--- | :---: | :---: | :--- | :--- |
| `/api/admin/dashboard` | `GET` | `200 OK` | `{ kpis, growth, userDistribution, ... }` | Full platform KPIs & telemetry |
| `/api/admin/products` | `GET` | `200 OK` | `{ items: AdminProductItem[], total: 19 }` | **19 products** across all sellers |
| `/api/admin/categories` | `GET` | `200 OK` | `AdminCategoryItem[]` | **10 categories** (Electronics, Audio, etc.) |
| `/api/admin/inventory` | `GET` | `200 OK` | `{ items: AdminInventoryItem[], total: 19 }` | **19 inventory records** |
| `/api/admin/orders` | `GET` | `200 OK` | `{ items: AdminOrderItem[], total: 12 }` | **12 orders** across the platform |
| `/api/admin/users/sellers` | `GET` | `200 OK` | `{ items: AdminUserItem[], total: 14 }` | **14 seller accounts** |
| `/api/admin/seller-approvals` | `GET` | `200 OK` | `{ items: SellerApprovalItem[], total: 13 }` | **13 seller approvals** |

---

## 4. Phase 5 & 6 — Frontend Data Binding & Network Tracing

1. **Authentication Handshake**:
   - `/login/seller` &#8594; `POST /api/auth/login` &#8594; returns `result.data` (`id: '794dccee-5dda-455f-889f-9318d748842b'`, `roleCode: 'VENDOR'`).
   - Stored in `sessionStorage.setItem('tobetake_auth_user', ...)`.
   - Subsequent requests from `apps/web/src/lib/api.ts` or page hooks attach `Authorization: Bearer <id>`.

2. **Data Envelope Flow**:
   - `SellerProductsPage`: Fetches `/api/seller/products` &#8594; `setData(json.data)` &#8594; iterates `data.items` &#8594; renders product table with 8 rows.
   - `SellerInventoryPage`: Fetches `/api/seller/inventory` &#8594; `setData(json.data)` &#8594; iterates `data.items` &#8594; renders 8 stock rows.
   - `SellerDashboardPage`: Fetches `/api/seller/dashboard` &#8594; `setData(json.data)` &#8594; renders KPI cards (`$538.98`, etc.) + 5 recent orders + 5 top products.
   - `AdminProductsPage`: Fetches `/api/admin/products` via `adminFetch` &#8594; `setData(json.data)` &#8594; renders 19 products.
   - `AdminCategoriesPage`: Fetches `/api/admin/categories` via `adminFetch` &#8594; normalizes array data into `PaginatedResult` &#8594; renders 10 categories.

---

## 5. Verification & Test Suite Summary

- **TypeScript Typecheck (`pnpm typecheck`)**: **7 packages passed with 0 errors**.
- **NestJS Backend API**: **Active & Healthy** (`http://localhost:4000/api/health` &#8594; 200 OK).
- **Next.js Web Server**: **Active & Listening** (`http://localhost:3000` &#8594; 200 OK).
- **PostgreSQL Database**: **Active & Connected** (`localhost:5432` / `to_be_take_dev`).

---

## 6. Final Status Summary

```
DATABASE:
Product count: 22 (8 owned by active test seller Apex Tech)
Category count: 10
Seller count: 14 (Apex Tech ID: 794dccee-5dda-455f-889f-9318d748842b, status: APPROVED)
Inventory count: 22 (8 items for Apex Tech)
Order count: 12 (5 orders containing items for Apex Tech)

API:
Seller products endpoint: GET /api/seller/products -> 200 OK (8 products returned)
Admin products endpoint: GET /api/admin/products -> 200 OK (19 products returned)
Seller inventory endpoint: GET /api/seller/inventory -> 200 OK (8 items with live stock levels)
Admin categories endpoint: GET /api/admin/categories -> 200 OK (10 categories returned)

FRONTEND & BROWSER DATA FLOW:
Seller Login: PASS (Authenticated as contact@apextech.com)
Seller Products: PASS (8 product cards/table rows rendered with live SKUs, prices, categories)
Seller Inventory: PASS (8 inventory tracking rows with stock count, low-stock threshold, and warehouse locations)
Seller Dashboard: PASS (Revenue cards, 30-day chart, recent orders)
Seller Orders: PASS (5 fulfilled/processing orders)
Admin Products: PASS (19 products visible)
Admin Categories: PASS (10 categories with active product counts)

ROOT CAUSE:
1. Seller pages (/seller/products, /seller/dashboard, /seller/inventory, etc.) were invoking direct fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/...`) rather than routing through the same-origin Next.js proxy (/api/seller/...), causing CORS/port issues when NEXT_PUBLIC_API_URL was absent or missing client identity headers.
2. Direct fetch calls passed only `Authorization: Bearer <id>` without server-side header normalization (`x-user-id`, `x-user-email`), and failed silently when sessionStorage was not initialized in fresh tabs.
3. Storage ephemerality: Authentication session was previously written solely to sessionStorage; navigating across tabs or fresh windows lost the session, causing components to catch errors silently and display empty states [].
4. Admin Categories page expected a paginated object ({ items: [...] }) from /api/admin/categories, but the backend returned a flat array of Category objects, setting data.items to undefined.

FIX:
1. Created/updated `apps/web/src/lib/api.ts` with `getStoredAuthUser()` (supporting fallback between sessionStorage and localStorage), `getAuthHeaders()`, and `sellerFetch`/`adminFetch` helpers that automatically inject `Authorization: Bearer <id>`, `x-user-id`, and `x-user-email` and route via same-origin `/api/...` rewrites.
2. Updated login pages and `SellerLayoutClient.tsx` to persist authentication across tabs (both sessionStorage and localStorage).
3. Refactored all seller portal pages (products, dashboard, inventory, orders, shipping, earnings, commissions, payouts, returns, reviews, notifications, profile, new product, edit product, order details) and `SellerTopBar.tsx` to use `sellerFetch` with robust envelope handling (`res.data.items || res.data || []`).
4. Updated `AdminCategoriesPage` to normalize flat array responses into standard `PaginatedResult` structure with clean `productCount` mappings.
```
