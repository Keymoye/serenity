Last updated: March 5, 2026 | Auto-generated from source

# Error Handling

This document describes the domain error class hierarchy and the HTTP mapping logic used throughout the project.

## Domain Errors (lib/domain/errors.ts)

```ts
export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  constructor(code: string, message: string, details?: unknown) { ... }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown, code = "VALIDATION_ERROR") { ... }
}

export class NotFoundError extends DomainError {
  constructor(message: string, details?: unknown) { ... }
}

export class ConflictError extends DomainError {
  constructor(code = "CONFLICT", message = "Conflict", details?: unknown) { ... }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized", details?: unknown) { ... }
}

export class InternalError extends DomainError {
  constructor(code = "INTERNAL_ERROR", message = "Internal server error.", details?: unknown) { ... }
}
```

All business logic within services throws one of these errors when an expected condition fails.
The `code` property is used by API controllers to convert the error into an HTTP response.

## Error Mapper (lib/utils/errorMapper.ts)

```ts
export function mapErrorToLegacyHttp(error: unknown): { status: number; body: LegacyErrorResponse } {
  const { status, code, message } = classify(error);
  return { status, body: { error: message, code } };
}

function classify(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof ValidationError) { return { status: 400, code: error.code, message: error.message }; }
  if (error instanceof NotFoundError) { return { status: 404, code: error.code, message: error.message }; }
  if (error instanceof ConflictError) { return { status: 409, code: error.code, message: error.message }; }
  if (error instanceof UnauthorizedError) { return { status: 401, code: error.code, message: error.message }; }
  if (error instanceof DomainError) { return { status: 500, code: error.code, message: error.message }; }
  return { status: 500, code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Internal server error." };
}
```

### HTTP Mapping Table

| Domain Error Class | Typical Codes | HTTP Status | Notes |
|--------------------|---------------|-------------|-------|
| ValidationError    | VALIDATION_ERROR, THERAPIST_NOT_ASSIGNED, RATE_LIMIT | 400 |
| NotFoundError      | NOT_FOUND      | 404 |
| ConflictError      | CONFLICT, SLOT_TAKEN, SLOT_ALREADY_BOOKED | 409 |
| UnauthorizedError  | UNAUTHORIZED   | 401 |
| DomainError        | INTERNAL_ERROR | 500 | fallback for any other domain error |
| Other (JS Error)   | —              | 500 | message preserved if available |

> API routes typically call `mapErrorToLegacyHttp` and then respond with `NextResponse.json(body, { status })`.

### Best Practices

- Services should throw one of the domain errors rather than raw errors.
- Do not expose sensitive details in error messages; use the `details` field for logging only.
- The UI layer should interpret the `code` field and display user‑friendly messages or retry logic.
