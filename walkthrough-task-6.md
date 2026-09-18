# Task 6 Walkthrough: Code Review & Unit Testing for Seller Registration

## Overview

**Sprint 1 — Task 6** is complete. We performed a comprehensive code review, security audit, unit test expansion, and full-suite verification across the **To Be Take** monorepo for the Seller Registration feature (Backend `POST /api/auth/register/seller` and Frontend `/register/seller`).

---

## 1. Code Review & Security Audit Summary

### Backend Review (`apps/api`)

- **Strict Role Isolation**: The Seller registration handler explicitly assigns `roleId` corresponding to the `VENDOR` role (`code: 'VENDOR'`, `name: 'Seller'`). Privilege escalation attacks via `roleId`, `role`, or `status` injection are blocked at DTO validation with `forbidNonWhitelisted: true`.
- **Credential Security**: Passwords are required to be strong (minimum 8 characters with lowercase, uppercase, number, and symbol) and hashed via `PasswordService` using `bcrypt` (10 rounds). Passwords and password hashes are stripped from all responses using `UserResponseDto`.
- **Database Consistency & Race Handling**: Uniqueness checks for username and email prevent duplicate user creation. Any database race condition hitting Prisma `P2002` error is intercepted and transformed into clean HTTP `409 Conflict` responses.
- **Audit & Defaults**: New Seller users are created with `status: ACTIVE`, verification flags initialized to `false`, zero failed login attempts, `isLocked: false`, `isDeleted: false`, and timestamped `passwordChangedAt`.

### Frontend Review (`apps/web`)

- **Sanitized Submission**: Payload excludes client-side secrets, `roleId`, and `confirmPassword`. Only validated and trimmed `firstName`, `lastName`, `username` (lowercased), `email` (lowercased), `password`, `departmentId` (number), and `designation` are sent.
- **Live UX & Validation**: Dynamic password complexity meter, real-time checklist, show/hide password toggles, department dynamic fetching with retry handler, and client-side error clearing on user input.
- **Accessibility & Design**: Semantic HTML5, explicit labels, ARIA attributes, robust color contrast, responsive form card with modern typography and visual hierarchy.

---

## 2. Test Suite Expansion

| Test File                                          | Previous Tests | Added / Updated                                                              | Total Tests                |
| :------------------------------------------------- | :------------- | :--------------------------------------------------------------------------- | :------------------------- |
| `apps/api/src/auth/auth.service.spec.ts`           | 10             | +4 (P2002 email & fallback branches for Admin & Seller)                      | 14 (44 in `@tobetake/api`) |
| `apps/api/test/auth.e2e-spec.ts`                   | 14             | +4 (Username length & name/designation validation bounds for Admin & Seller) | 18 (22 in e2e suite)       |
| `apps/web/src/app/register/seller/page.test.tsx`   | 12             | +3 (Min-length validation, input error clearing, server 400 array rendering) | 15 (17 in `@tobetake/web`) |
| `packages/database/src/__tests__/database.spec.ts` | 7              | Unchanged (all passing)                                                      | 7                          |

---

## 3. Monorepo Verification Results

All automated verification checks executed and passed with zero errors:

- **Format Check**: `pnpm format:check` -> **PASS**
- **Typecheck**: `pnpm typecheck` -> **PASS** (7/7 packages)
- **Linting**: `pnpm lint` -> **PASS** (0 warnings, 0 errors)
- **Frontend Unit Tests**: `pnpm --filter @tobetake/web test` -> **PASS** (17 tests, 2 suites)
- **Backend Unit Tests**: `pnpm --filter @tobetake/api test` -> **PASS** (44 tests, 7 suites)
- **Backend E2E Tests**: `pnpm --filter @tobetake/api test:e2e` -> **PASS** (22 tests, 2 suites)
- **Database Tests**: `pnpm --filter @tobetake/database test` -> **PASS** (7 tests, 1 suite)
- **Production Build**: `pnpm build` -> **PASS** (4/4 packages built cleanly)

**Total Test Count**: **90 passing tests** across the entire monorepo.

---

## 4. Status

READY FOR TASK 7
