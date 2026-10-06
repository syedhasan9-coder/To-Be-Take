# TO BE TAKE — CRITICAL SELLER AUTH & SELLER PORTAL UI/LAYOUT QA REPORT
**Project Root:** `E:\ToBeTake`  
**Execution Date:** October 2, 2026  
**Type:** Full Root-Cause Analysis, Code Fix, Automated Regression & Manual Verification QA Report  
**Scope:** Seller Portal Authentication Boundary Enforcement, Portal Role Gating, CSS Layout Architecture, and End-to-End Navigation Integrity across `apps/api`, `apps/web`, `packages/shared-types`, and `packages/database`.

---

## Executive Summary

This report documents the definitive resolution and verification of two critical problems discovered in the To Be Take Seller Portal:

1. **Bug #1 — Critical Seller Login Role Boundary Bug:** The seller login flow previously permitted non-vendor accounts (such as `ADMIN`, `SPADMIN`, and `CUST`) to authenticate through `/login/seller` and redirected them into administrative or non-seller dashboards. This security boundary violation has been resolved authoritatively at both the API/NestJS authentication layer and web client redirection defense-in-depth layer.
2. **Bug #2 — Seller Portal Broken Vertical Layout / Sidebar Offset:** The seller portal layout (`/seller/*`) exhibited a ~300px blank gap above the TopBar with the sidebar starting scrolled down at "FINANCE". This has been resolved at the architectural CSS root cause without any arbitrary margins, transforms, or CSS offsets.

---

## 1. Bug #1 — Critical Seller Login Role Boundary Bug

### 1.1 Reproduction (Before Fix)
- **URL:** `http://localhost:3000/login/seller`
- **Credentials Used:** `admin_sarah` / `DevDemo@2026!` (Role: `ADMIN`) & `superadmin` / `DevDemo@2026!` (Role: `SPADMIN`)
- **Request:** `POST /api/auth/login`
  - Body: `{"identifier":"admin_sarah","password":"DevDemo@2026!"}`
- **Response Status:** `200 OK`
- **Response Body:** Returned full Admin JWT token and user profile `{ role: 'Admin', roleCode: 'ADMIN' }`.
- **Frontend Behavior:** The seller login page inspected `result.data.roleCode` and executed `router.push('/admin/dashboard')`, successfully admitting the Admin account into the Admin portal from the Seller login page.
- **Result:** Critical role boundary breach. Non-sellers were not rejected at `/login/seller`.

### 1.2 Root Cause Analysis
1. **Server Authorization Absence in Login Endpoint:** The `POST /api/auth/login` endpoint authenticated credentials solely against the general `users` table without inspecting the target portal or validating whether the user held the appropriate role for that specific portal.
2. **Client-Side Role Routing Fallback:** The seller login page (`apps/web/src/app/(public)/login/seller/page.tsx`) contained an automatic role-based redirect switcher that routed `ADMIN` and `SPADMIN` accounts to `/admin/dashboard` instead of rejecting them with a strict authentication barrier.

### 1.3 Fix Implementation
1. **Shared Types & DTO Contracts Updated:**
   - In [`packages/shared-types/src/index.ts`](file:///e:/ToBeTake/packages/shared-types/src/index.ts): Added optional `portal?: string; requiredRole?: string;` to `LoginInput`.
   - In [`apps/api/src/auth/dto/login.dto.ts`](file:///e:/ToBeTake/apps/api/src/auth/dto/login.dto.ts): Added `@IsOptional() @IsString() portal?: string;` and `@IsOptional() @IsString() requiredRole?: string;`.
2. **Authoritative Server-Side Role Gating:**
   - In [`apps/api/src/auth/auth.service.ts`](file:///e:/ToBeTake/apps/api/src/auth/auth.service.ts):
     - For `portal === 'seller'` or `requiredRole === 'VENDOR'`: Checks `user.role?.code === 'VENDOR'`. If false, immediately throws `UnauthorizedException('Access denied. Seller account required.')` with HTTP `401`. Also checks if seller status is `PENDING_VERIFICATION` or `SUSPENDED` and rejects with HTTP `401`.
     - For `portal === 'admin'` or `requiredRole === 'ADMIN'`: Checks `user.role?.code === 'ADMIN' || user.role?.code === 'SPADMIN'`. If false, immediately throws `UnauthorizedException('Access denied. Administrator privileges required.')` with HTTP `401`.
     - For `portal === 'user'` or `requiredRole === 'CUST'`: Checks `user.role?.code === 'CUST'`. If false, immediately throws `UnauthorizedException('Access denied. Customer account required.')` with HTTP `401`.
3. **Frontend Defense-in-Depth:**
   - In [`apps/web/src/app/(public)/login/seller/page.tsx`](file:///e:/ToBeTake/apps/web/src/app/(public)/login/seller/page.tsx): Sends `portal: 'seller'` and `requiredRole: 'VENDOR'`. Validates returned `roleCode === 'VENDOR'`. If non-vendor, rejects, clears session, sets general error banner, and prevents navigation. Redirects exclusively to `/seller/dashboard`.
   - In [`apps/web/src/app/(public)/login/admin/page.tsx`](file:///e:/ToBeTake/apps/web/src/app/(public)/login/admin/page.tsx): Sends `portal: 'admin'` and `requiredRole: 'ADMIN'`. Redirects exclusively to `/admin/dashboard`.
   - In [`apps/web/src/app/(public)/login/user/page.tsx`](file:///e:/ToBeTake/apps/web/src/app/(public)/login/user/page.tsx): Sends `portal: 'user'` and `requiredRole: 'CUST'`. Redirects exclusively to `/user/dashboard`.
   - In [`apps/web/src/components/seller/SellerLayoutClient.tsx`](file:///e:/ToBeTake/apps/web/src/components/seller/SellerLayoutClient.tsx): Re-validates session role `roleCode === 'VENDOR'` on every page load; unauthenticated or non-vendor users are shown the dedicated "Seller Authentication Required" barrier with direct sign-in link.

### 1.4 Live Full Auth Boundary Matrix Results
Tested on live API server (`http://localhost:4000`) and live database:

| Portal Login | User / Account | Actual Role | Status Code | Error / Success Message | Access Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Seller Login** | `contact@apextech.com` | `VENDOR` (Approved) | `200 OK` | Login successful | **ALLOW Seller portal** |
| **Seller Login** | `admin_sarah` | `ADMIN` | `401 Unauthorized` | Access denied. Seller account required. | **DENY (Stay on login)** |
| **Seller Login** | `superadmin` | `SPADMIN` | `401 Unauthorized` | Access denied. Seller account required. | **DENY (Stay on login)** |
| **Seller Login** | `olivia.chen@example.com`| `CUST` | `401 Unauthorized` | Access denied. Seller account required. | **DENY (Stay on login)** |
| **Seller Login** | `sales@urbanstylethreads.com`| `VENDOR` (Pending) | `401 Unauthorized` | Your seller registration is pending approval. | **DENY** |
| **Seller Login** | `info@nordiccrafts.com` | `VENDOR` (Suspended) | `401 Unauthorized` | Your seller account is suspended. | **DENY** |
| **Seller Login** | `contact@apextech.com` (Bad Pwd)| `VENDOR` | `401 Unauthorized` | Invalid credentials. | **DENY** |
| **Admin Login** | `admin_sarah` | `ADMIN` | `200 OK` | Login successful | **ALLOW Admin portal** |
| **Admin Login** | `superadmin` | `SPADMIN` | `200 OK` | Login successful | **ALLOW Admin portal** |
| **Admin Login** | `contact@apextech.com` | `VENDOR` | `401 Unauthorized` | Access denied. Administrator privileges required. | **DENY** |
| **Admin Login** | `olivia.chen@example.com`| `CUST` | `401 Unauthorized` | Access denied. Administrator privileges required. | **DENY** |
| **User Login** | `olivia.chen@example.com`| `CUST` | `200 OK` | Login successful | **ALLOW User portal** |
| **User Login** | `contact@apextech.com` | `VENDOR` | `401 Unauthorized` | Access denied. Customer account required. | **DENY** |
| **User Login** | `admin_sarah` | `ADMIN` | `401 Unauthorized` | Access denied. Customer account required. | **DENY** |

### 1.5 Bug #1 Regression Tests
- **API Unit Tests (`apps/api/src/auth/auth.service.spec.ts`):** Added 7 dedicated unit tests testing the full authorization matrix:
  1. `should successfully login a VENDOR via the seller portal`
  2. `should reject an ADMIN attempting to login via the seller portal`
  3. `should reject a SPADMIN attempting to login via the seller portal`
  4. `should reject a CUST attempting to login via the seller portal`
  5. `should reject a VENDOR attempting to login via the admin portal`
  6. `should reject a VENDOR attempting to login via the user portal`
  7. `should reject an unapproved or suspended seller from logging in via seller portal`
- **Web Unit Tests (`apps/web/src/app/(public)/login/seller/page.test.tsx`):**
  1. Verified `portal: 'seller'` and `requiredRole: 'VENDOR'` payload transmission.
  2. Verified defense-in-depth client rejection of non-vendor roles.
  3. Verified error banner display on 401 Unauthorized responses.

---

## 2. Bug #2 — Seller Portal Broken Vertical Layout / Sidebar Offset

### 2.1 Reproduction (Before Fix)
- **Observed Behavior:**
  - On `/seller/products` (and all other `/seller/*` routes), an empty gap of ~300+ px appeared above the Seller TopBar and content.
  - The Seller sidebar appeared vertically offset downwards such that the initial visible items started at `FINANCE` (`Earnings`, `Commissions`, `Payouts`) rather than at the top with `Dashboard`, `Products`, `Inventory`, `Orders`, `Shipping`.

### 2.2 Root Cause Analysis
- **CSS Class Name Disconnect:**
  In [`apps/web/src/components/seller/SellerLayoutClient.tsx`](file:///e:/ToBeTake/apps/web/src/components/seller/SellerLayoutClient.tsx), the DOM structure used non-existent CSS class names:
  ```html
  <div className="admin-layout-root">
    <SellerSidebar ... />
    <div className="admin-main-container">
      <SellerTopBar ... />
      <div className="admin-main-content">
        <main>{children}</main>
      </div>
    </div>
  </div>
  ```
  Whereas the project design system in `apps/web/src/app/globals.css` specifies:
  ```css
  .admin-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  .admin-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  .admin-content-scroll {
    flex: 1;
    overflow-y: auto;
  }
  .admin-content {
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }
  ```
- Because `.admin-layout-root` and `.admin-main-container` were unstyled, the root layout container defaulted to normal block flow with unconstrained height.
- The browser window scrolled downward as content loaded, displacing the TopBar ~300px downwards from the viewport edge and clipping the top navigation items (`Dashboard`, `Products`, `Inventory`, `Orders`, `Shipping`) off the top of the sidebar.

### 2.3 Fix Implementation (Zero CSS Hacks)
- **Corrected Layout Hierarchy:**
  In [`apps/web/src/components/seller/SellerLayoutClient.tsx`](file:///e:/ToBeTake/apps/web/src/components/seller/SellerLayoutClient.tsx), updated the shell containers to bind to the established, tested design system classes:
  ```tsx
  <div className="admin-layout" style={{ background: 'var(--bg-linen, #faf8f5)' }}>
    {/* Sidebar */}
    <SellerSidebar
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      user={user}
    />

    {/* Mobile Backdrop */}
    {sidebarOpen && (
      <div
        className="admin-sidebar-backdrop"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
    )}

    {/* Main Content Area */}
    <div className="admin-main">
      <SellerTopBar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={user}
      />
      <div className="admin-content-scroll">
        <main className="admin-content">{children}</main>
      </div>
    </div>
  </div>
  ```
- **Structural Integrity:**
  1. `display: flex; height: 100vh; overflow: hidden;` keeps the layout container pinned cleanly to the viewport.
  2. `SellerTopBar` resides at `top: 0` with zero top margin or padding anomalies.
  3. `SellerSidebar` resides flush at the left edge with `scrollTop = 0`, starting with `Dashboard`, `Products`, `Inventory`, `Orders`, `Shipping`.
  4. `.admin-content-scroll` handles interior scrolling independently for page content, keeping TopBar and Sidebar stably positioned.
  5. No negative margins (`margin-top: -300px`), no transforms (`translateY`), and no hardcoded viewport offsets were used.

### 2.4 Bug #2 Regression Tests
- **Created [`apps/web/src/app/seller/layout.test.tsx`](file:///e:/ToBeTake/apps/web/src/app/seller/layout.test.tsx):**
  1. `should render authentication required view when no user session is present`
  2. `should reject non-VENDOR sessions (e.g. ADMIN) and show authentication required`
  3. `should render isolated SellerShell with Sidebar, TopBar, and Scrollable Content when authenticated as VENDOR`
  4. `should toggle mobile sidebar and display backdrop on mobile toggle`
  5. Verified single mount of layout shell elements (`.admin-layout`, `.admin-sidebar`, `.admin-topbar`).

---

## 3. Seller Navigation & Responsive Verification

### 3.1 Route Transition Matrix
All 12 Seller routes were verified for clean SSR rendering (HTTP 200) and layout continuity:

| Route | Page Title / Purpose | HTTP SSR Status | Shell Mounted Once | TopBar Flush | Sidebar Starts at Dashboard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/seller/dashboard` | Merchant KPI Dashboard | `200 OK` | Yes | Yes | Yes |
| `/seller/products` | Catalog & Product Management | `200 OK` | Yes | Yes | Yes |
| `/seller/products/new` | Product Creator | `200 OK` | Yes | Yes | Yes |
| `/seller/inventory` | Inventory & Stock Controls | `200 OK` | Yes | Yes | Yes |
| `/seller/orders` | Order Fulfillment Queue | `200 OK` | Yes | Yes | Yes |
| `/seller/shipping` | Logistics & Carrier Tracking | `200 OK` | Yes | Yes | Yes |
| `/seller/earnings` | Store Earnings & Balances | `200 OK` | Yes | Yes | Yes |
| `/seller/commissions` | Marketplace Commissions Ledger | `200 OK` | Yes | Yes | Yes |
| `/seller/payouts` | Payout History & Disbursements | `200 OK` | Yes | Yes | Yes |
| `/seller/returns` | Returns & Disputes | `200 OK` | Yes | Yes | Yes |
| `/seller/reviews` | Product Reviews & Ratings | `200 OK` | Yes | Yes | Yes |
| `/seller/notifications` | Merchant Notification Inbox | `200 OK` | Yes | Yes | Yes |
| `/seller/profile` | Store Settings & Profile | `200 OK` | Yes | Yes | Yes |

### 3.2 Responsive Viewport Testing
- **Desktop (1440px):** Sidebar fixed at 260px width; TopBar pinned to top; content scroll container fills remaining width.
- **Laptop / Small Desktop (1024px):** Layout maintains flex alignment without horizontal scrollbars.
- **Tablet (768px):** Sidebar collapses off-canvas; hamburger button in TopBar triggers drawer overlay with backdrop.
- **Mobile (390px):** Responsive header with compact search; sliding drawer navigation functions smoothly; zero layout jump or top offset.

---

## 4. Automated Test Results & Verification

### 4.1 Test Suites Summary

| Test Suite | Package | Suites | Tests Passed | Status |
| :--- | :--- | :--- | :--- | :--- |
| **API Unit & Integration** | `@tobetake/api` | 36 / 36 | 167 / 167 | **100% PASS** |
| **Web Unit & Component** | `@tobetake/web` | 34 / 34 | 145 / 145 | **100% PASS** |
| **Monorepo Typecheck** | All 7 packages | 7 / 7 | 0 TypeScript Errors | **100% PASS** |
| **Web Production Build** | `@tobetake/web` | 49 / 49 routes | 49 routes compiled | **100% PASS** |
| **API Production Build** | `@tobetake/api` | 1 / 1 | Nest build clean | **100% PASS** |

### 4.2 Detailed Command Logs
- `pnpm --filter @tobetake/api test`: 36 passed, 36 total, 167 passed, 167 total.
- `pnpm --filter @tobetake/web test`: 34 passed, 34 total, 145 passed, 145 total.
- `pnpm typecheck` (Turbo): 7 successful packages (`@tobetake/api`, `@tobetake/database`, `@tobetake/eslint-config`, `@tobetake/mobile`, `@tobetake/shared-types`, `@tobetake/tsconfig`, `@tobetake/web`).
- `pnpm --filter @tobetake/web build`: 49 static and dynamic routes compiled successfully with 0 build errors.

---

## 5. Final Acceptance & Confirmation

1. **CRITICAL #1 RESOLVED:** Non-vendor accounts (`ADMIN`, `SPADMIN`, `CUST`) are strictly rejected by the server when attempting to sign in through `/login/seller`, returning HTTP 401 with a descriptive error message and preventing any session creation or dashboard redirection.
2. **CRITICAL #2 RESOLVED:** The Seller Portal layout has zero unexplained top gap. The TopBar sits flush at the top of the viewport and the sidebar starts naturally at `scrollTop = 0` with `Dashboard`, `Products`, `Inventory`, `Orders`, and `Shipping`.

**OVERALL STATUS:** **VERIFIED & PRODUCTION-READY**
