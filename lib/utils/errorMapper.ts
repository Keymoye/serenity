import {
  DomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from "../domain/errors";

export type StandardErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    correlationId?: string;
  };
};

export type LegacyErrorResponse = {
  error: string;
  code: string;
};

export function mapErrorToHttp(
  error: unknown,
  correlationId?: string,
): { status: number; body: StandardErrorResponse } {
  const { status, code, message } = classify(error);
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        correlationId,
      },
    },
  };
}

export function mapErrorToLegacyHttp(
  error: unknown,
): { status: number; body: LegacyErrorResponse } {
  const { status, code, message } = classify(error);
  return {
    status,
    body: { error: message, code },
  };
}

function classify(error: unknown): { status: number; code: string; message: string } {
  if (error instanceof ValidationError) {
    return { status: 400, code: error.code, message: error.message };
  }
  if (error instanceof NotFoundError) {
    return { status: 404, code: error.code, message: error.message };
  }
  if (error instanceof ConflictError) {
    return { status: 409, code: error.code, message: error.message };
  }
  if (error instanceof UnauthorizedError) {
    return { status: 401, code: error.code, message: error.message };
  }
  if (error instanceof ForbiddenError) {
    return { status: 403, code: error.code, message: error.message };
  }
  if (error instanceof DomainError) {
    return { status: 500, code: error.code, message: error.message };
  }
  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: error instanceof Error ? error.message : "Internal server error.",
  };
}

