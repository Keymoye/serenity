export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown, code = "VALIDATION_ERROR") {
    super(code, message, details);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("NOT_FOUND", message, details);
  }
}

export class ConflictError extends DomainError {
  constructor(code = "CONFLICT", message = "Conflict", details?: unknown) {
    super(code, message, details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized", details?: unknown) {
    super("UNAUTHORIZED", message, details);
  }
}

export class InternalError extends DomainError {
  constructor(code = "INTERNAL_ERROR", message = "Internal server error.", details?: unknown) {
    super(code, message, details);
  }
}

