export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class DeskproTimeoutError extends Error {
  constructor(message = "Deskpro request timed out") {
    super(message);
    this.name = "DeskproTimeoutError";
  }
}
