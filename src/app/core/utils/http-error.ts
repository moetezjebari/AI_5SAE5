import { HttpErrorResponse } from '@angular/common/http';

/** Message lisible à partir d'une erreur HTTP (réponse du backend, réseau coupé, etc.). */
export function errorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Serveur injoignable. Vérifiez votre connexion.';
    const body = err.error as { message?: string; fieldErrors?: Record<string, string> } | null;
    const first = body?.fieldErrors ? Object.values(body.fieldErrors)[0] : undefined;
    return first ?? body?.message ?? fallback;
  }
  return fallback;
}
