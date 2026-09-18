# Sprint 1 — Task 5 Walkthrough: Seller Registration Frontend Development

## 1. Implementation Summary

Implemented the complete **Seller Registration Frontend** for the To Be Take marketplace platform within the Next.js App Router application (`apps/web`).

- **Route**: `/register/seller` (`apps/web/src/app/register/seller/page.tsx`)
- **Backend Integration**: Integrates directly with the completed Task 4 backend endpoints:
  - `POST /api/auth/register/seller`
  - `GET /api/departments`
- **Landing Page Link**: Added the Seller Registration Portal to `apps/web/src/app/page.tsx`.
- **Testing**: Added a dedicated frontend test suite (`apps/web/src/app/register/seller/page.test.tsx`) covering rendering, validation, dynamic department loading/retry, password strength feedback, API submission security, and error handling.

---

## 2. UI/UX Architecture

- **Layout & Structure**:
  - Clear, human-friendly heading: **Create Seller Account** with subtext explaining marketplace onboarding.
  - Form organized into 3 logical visual sections:
    1. **Personal Information**: First Name, Last Name
    2. **Account Information**: Username, Email Address, Password, Confirm Password
    3. **Seller Information**: Department (dynamic dropdown), Designation / Job Title
- **Responsive Design**:
  - Two-column responsive grid on desktop/tablets (`.form-row`).
  - Naturally collapses into a single-column layout on mobile viewports (<640px).
- **Client-side Form Validation**:
  - **First Name & Last Name**: Required, trimmed, 2–50 characters.
  - **Username**: Required, 3–30 characters, alphanumeric with hyphens and underscores (`/^[a-zA-Z0-9_-]+$/`), normalized to lowercase.
  - **Email Address**: Required, RFC-compliant email pattern, max 255 characters, normalized to lowercase.
  - **Password**: Required, enforces all 5 security rules (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special symbol).
  - **Confirm Password**: Required, verifies strict match with password.
  - **Department**: Required, dynamic selection from loaded platform departments.
  - **Designation**: Required, trimmed, 2–100 characters.
- **Password Experience**:
  - Real-time password strength meter (`Weak`, `Fair`, `Good`, `Strong`) with progress bar.
  - Dynamic 5-point requirement checklist with visual feedback (`✓` / `○`).
  - Accessible Show/Hide password toggle buttons for both password fields with aria-labels.
- **Loading, Success & Error Feedback**:
  - **Loading State**: Disables form and submit button, shows `Creating Seller Account...` indicator, and prevents duplicate submissions.
  - **Error States**: Inline errors tied via `aria-describedby` and top-level error banner for server/conflict errors (translates HTTP 409, 400, 403, and network errors into clean human messages).
  - **Success State**: Displays a clean success card showing sanitized user details (Seller ID, Full Name, Username, Email, Assigned Role `Seller (VENDOR)`, Department, Designation, Account Status `ACTIVE`) with reset and home navigation actions.
- **Accessibility**:
  - Proper label associations (`htmlFor`), `aria-invalid`, `aria-describedby`, `aria-label`, `role="alert"`, `aria-live="polite"`, and full keyboard navigation.

---

## 3. API Integration

- **Department Loading**:
  - Endpoint: `GET /api/departments`
  - Dynamically populates the Department dropdown with `{department.name} ({department.code})`.
  - Displays loading skeleton/placeholder while fetching.
  - If API fails, presents a human-friendly error banner with an interactive **Retry** button.
- **Seller Registration Submission**:
  - Endpoint: `POST /api/auth/register/seller`
  - Headers: `Content-Type: application/json`
  - Payload Fields Sent:
    ```json
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "username": "jane_store",
      "email": "jane@store.com",
      "password": "ValidPassword123!",
      "departmentId": 2,
      "designation": "Store Manager"
    }
    ```
  - Forbidden Fields Filtered: `confirmPassword`, `roleId`, `role`, `status`, `userType`, `isEmailVerified`, `isMobileVerified`, and secrets are strictly **never** sent from the client.

---

## 4. Security Review

- **No Client Secrets**: `SELLER_REGISTRATION_SECRET` and `x-seller-registration-key` are strictly excluded from frontend code.
- **Role Governance**: The frontend has no role selector and cannot specify `roleId` or `role`. The backend strictly binds the user to `VENDOR` ('Seller').
- **Input Sanitization**: Client trims names/designations and lowercases username/email.
- **Zero Sensitive Data Exposure**: Password and password hashes are never exposed or rendered in response details.

---

## 5. Verification Results

All automated and monorepo checks pass with zero errors:

| Check                | Command                                 | Result   | Details                                                |
| :------------------- | :-------------------------------------- | :------- | :----------------------------------------------------- |
| **Format Check**     | `pnpm format:check`                     | **PASS** | Prettier code style verified across 100% of files      |
| **Typecheck**        | `pnpm typecheck`                        | **PASS** | TypeScript compiler 0 errors across 7 packages         |
| **ESLint**           | `pnpm lint`                             | **PASS** | 0 warnings, 0 errors                                   |
| **Web Tests**        | `pnpm --filter @tobetake/web test`      | **PASS** | 2 test suites, 14 tests passed                         |
| **API Unit Tests**   | `pnpm --filter @tobetake/api test`      | **PASS** | 7 test suites, 40 tests passed                         |
| **API E2E Tests**    | `pnpm --filter @tobetake/api test:e2e`  | **PASS** | 2 test suites, 18 tests passed                         |
| **Database Tests**   | `pnpm --filter @tobetake/database test` | **PASS** | 1 test suite, 7 tests passed                           |
| **Production Build** | `pnpm build`                            | **PASS** | Turborepo build 4/4 tasks succeeded (Next.js + NestJS) |

---

## 6. Files Created / Modified

| File                                                                                | Change Type | Description                                                                                                   |
| :---------------------------------------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------ |
| [page.tsx](file:///e:/ToBeTake/apps/web/src/app/register/seller/page.tsx)           | **NEW**     | Seller Registration page component with full validation, dynamic departments, password UX, and success screen |
| [page.test.tsx](file:///e:/ToBeTake/apps/web/src/app/register/seller/page.test.tsx) | **NEW**     | Comprehensive unit & integration tests for Seller Registration                                                |
| [page.test.tsx](file:///e:/ToBeTake/apps/web/src/app/register/admin/page.test.tsx)  | **NEW**     | Regression test suite for existing Admin Registration page                                                    |
| [jest.config.js](file:///e:/ToBeTake/apps/web/jest.config.js)                       | **NEW**     | Jest configuration for `@tobetake/web`                                                                        |
| [jest.setup.ts](file:///e:/ToBeTake/apps/web/jest.setup.ts)                         | **NEW**     | Jest DOM matchers setup                                                                                       |
| [page.tsx](file:///e:/ToBeTake/apps/web/src/app/page.tsx)                           | **MODIFY**  | Added Seller Registration Portal hero action button and feature card                                          |
| [package.json](file:///e:/ToBeTake/apps/web/package.json)                           | **MODIFY**  | Added test script and testing dependencies (`@testing-library/react`, `jest`, `ts-jest`)                      |
| [turbo.json](file:///e:/ToBeTake/turbo.json)                                        | **MODIFY**  | Updated test task inputs to include `src/**` and `test/**`                                                    |
| [.npmrc](file:///e:/ToBeTake/.npmrc)                                                | **MODIFY**  | Added `@parcel/watcher` to approved built dependencies                                                        |

---

## 7. Regression Confirmation

- Existing Admin Registration (`/register/admin`) continues to function with full validation, dynamic department allocation, and passing regression test suites.
- Tasks 1–4 backend modules (Database schema/seeds, Admin API, Health check, Seller API backend) remain 100% intact and passing all unit and E2E test suites.

---

## 8. Remaining Risks

None. All validation rules, security guarantees, error handlers, and build checks have been executed and verified.

---

## 9. Sprint Status

**READY FOR TASK 6**
