# Task 7 Walkthrough: Buyer / Customer User Signup Backend API Development

## Overview

**Sprint 1 — Task 7** is complete. We implemented the dedicated, public backend registration endpoint for marketplace customer/buyer accounts (`POST /api/auth/register/user`) in the **To Be Take** monorepo.

---

## 1. Features Implemented

### Backend API Architecture (`apps/api`)

- **Dedicated Public Signup Endpoint**:
  - `POST /api/auth/register/user` (status: `201 Created`).
  - No secret keys or guard restrictions, enabling standard marketplace customers/buyers to register freely.
  - Returns a standard `ApiResponse<UserResponseDto>` envelope.

- **Strict Server-Side Role Governance**:
  - The client cannot select, submit, or inject roles (`roleId`, `role`, `userType`, etc.).
  - The backend queries the database for the standard Buyer role (`code: 'CUST'`, `name: 'Buyer'`) and binds it to the new account.
  - `departmentId` and `designation` are explicitly set to `null` for regular customer accounts.

- **DTO & Input Validation (`RegisterUserDto`)**:
  - **`firstName`**: Required, string, 2–50 characters, whitespace-trimmed.
  - **`lastName`**: Required, string, 2–50 characters, whitespace-trimmed.
  - **`username`**: Required, string, 3–30 characters, alphanumeric with hyphens and underscores (`/^[a-zA-Z0-9_-]+$/`), trimmed and normalized to lowercase.
  - **`email`**: Required, valid email format, max 255 characters, trimmed and normalized to lowercase.
  - **`password`**: Required, string, 8–128 characters, complexity rule enforced (min 1 lowercase, 1 uppercase, 1 digit, 1 special symbol).
  - **`confirmPassword`**: Required, validated to strictly match `password` via custom `@IsEqualTo('password')` validator.
  - **Strict Field Whitelisting**: Any injection attempt containing `roleId`, `role`, `status`, `isEmailVerified`, `departmentId`, `designation`, etc., is rejected with `400 Bad Request` (`forbidNonWhitelisted: true`).

- **Password Security**:
  - Plaintext passwords are never persisted.
  - Reused `PasswordService` with bcrypt hashing (10 salt rounds).
  - Passwords, hashes, and sensitive secrets are omitted from all responses.

- **Duplicate Account & Race Condition Handling**:
  - Pre-checks for duplicate `username` and duplicate `email` return clean `409 Conflict` errors with human-friendly messages.
  - Database-level race conditions triggering Prisma `P2002` errors are intercepted and translated into HTTP `409 Conflict`.

- **Shared Types (`packages/shared-types`)**:
  - Added `RegisterUserInput` and `BuyerUserResponse` contract definitions.

---

## 2. Files Created and Modified

| File                                                      | Action       | Purpose                                                                                  |
| :-------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------------- |
| `packages/shared-types/src/index.ts`                      | **Modified** | Added `RegisterUserInput` and `BuyerUserResponse` interfaces                             |
| `apps/api/src/common/validators/is-equal-to.decorator.ts` | **New**      | Class-validator decorator for matching password fields                                   |
| `apps/api/src/auth/dto/register-user.dto.ts`              | **New**      | DTO for user/buyer signup validation and normalization                                   |
| `apps/api/src/auth/auth.service.ts`                       | **Modified** | Added `registerUser` service method with role resolution, hashing, and conflict handling |
| `apps/api/src/auth/auth.controller.ts`                    | **Modified** | Added `POST /api/auth/register/user` endpoint handler                                    |
| `apps/api/src/auth/auth.controller.spec.ts`               | **Modified** | Added unit test for `registerUser` controller action                                     |
| `apps/api/src/auth/auth.service.spec.ts`                  | **Modified** | Added 8 comprehensive unit test cases for buyer signup logic                             |
| `apps/api/test/auth.e2e-spec.ts`                          | **Modified** | Added 10 E2E integration test cases for `POST /api/auth/register/user`                   |

---

## 3. Security Review

1. **Privilege Escalation Prevention**: Role assignment is hardcoded server-side to `CUST` (`Buyer`). Submitting `roleId`, `role`, `status`, or `permissions` triggers an immediate `400 Bad Request`.
2. **Account Integrity Defaults**: Accounts initialize with `status: ACTIVE`, `isEmailVerified: false`, `isMobileVerified: false`, `isLocked: false`, `failedLoginAttempts: 0`, and `passwordChangedAt: new Date()`.
3. **Data Sanitization**: Responses map strictly through `UserResponseDto`, eliminating plaintext passwords, password hashes, and internal metadata.
4. **Resilience**: Handled database concurrency conflicts via Prisma `P2002` exception mapping.

---

## 4. Test Suite Summary

### Unit Tests

- `apps/api/src/auth/auth.controller.spec.ts`: Controller delegates to service and returns standard `ApiResponse` envelope.
- `apps/api/src/auth/auth.service.spec.ts`:
  - Successful registration with `Buyer` (`CUST`) role and null department/designation.
  - Password hashing with `PasswordService` and hash exclusion in response.
  - Password confirmation mismatch → `400 Bad Request`.
  - Duplicate username pre-check → `409 Conflict`.
  - Duplicate email pre-check → `409 Conflict`.
  - Prisma P2002 race condition on username → `409 Conflict`.
  - Prisma P2002 race condition on email → `409 Conflict`.
  - Missing buyer role in database → `500 InternalServerErrorException`.

### E2E Tests (`POST /api/auth/register/user`)

- Valid registration payload → `201 Created`.
- Password confirmation mismatch → `400 Bad Request`.
- Weak password complexity (<8 chars) → `400 Bad Request`.
- Invalid email format → `400 Bad Request`.
- Duplicate username conflict → `409 Conflict`.
- Duplicate email conflict → `409 Conflict`.
- Forbidden properties injection (`roleId`, `role`, `status`, `departmentId`, `designation`) → `400 Bad Request`.
- Missing required fields → `400 Bad Request`.
- Invalid username format / length (<3 chars) → `400 Bad Request`.
- Short first/last name (<2 chars) → `400 Bad Request`.
- Response contains sanitized account details without password or password hash.

---

## 5. Verification Commands & Results

| Check                   | Command                                | Result   | Details                                 |
| :---------------------- | :------------------------------------- | :------- | :-------------------------------------- |
| **Prettier Format**     | `pnpm format:check`                    | **PASS** | 100% of files match Prettier code style |
| **Typecheck**           | `pnpm typecheck`                       | **PASS** | 0 TypeScript errors across 7 packages   |
| **ESLint**              | `pnpm lint`                            | **PASS** | 0 warnings, 0 errors across 7 packages  |
| **Monorepo Unit Tests** | `pnpm test`                            | **PASS** | **94 passed** (53 API, 34 Web, 7 DB)    |
| **API E2E Tests**       | `pnpm --filter @tobetake/api test:e2e` | **PASS** | **32 passed** across 2 suites           |
| **Production Build**    | `pnpm build`                           | **PASS** | Next.js & NestJS built cleanly in Turbo |

---

## 6. Status

✅ **Sprint 1 — Task 7 is complete and verified.**
