export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly errors?: Array<{ field: string; message: string }>,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static badRequest(message: string, errors?: Array<{ field: string; message: string }>) {
    return new AppError("VALIDATION_ERROR", message, 400, errors);
  }

  static unauthorized(message = "Non authentifié") {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Accès non autorisé", code = "FORBIDDEN") {
    return new AppError(code, message, 403);
  }

  static notFound(message = "Ressource introuvable") {
    return new AppError("NOT_FOUND", message, 404);
  }

  static conflict(code: string, message: string) {
    return new AppError(code, message, 409);
  }

  static unprocessable(code: string, message: string, data?: unknown) {
    return new AppError(code, message, 422, undefined, data);
  }

  static subscriptionExpired(data: { expiredSince: string; daysOverdue: number }) {
    return new AppError("SUBSCRIPTION_EXPIRED", "Votre abonnement a expiré. Veuillez le renouveler.", 403, undefined, data);
  }

  static rateLimited(message = "Trop de tentatives. Réessayez plus tard.") {
    return new AppError("RATE_LIMITED", message, 429);
  }

  static notImplemented(feature: string) {
    return new AppError("NOT_IMPLEMENTED", `${feature} n'est pas encore disponible.`, 501);
  }
}
