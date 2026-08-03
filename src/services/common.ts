/**
 * API error item returned in ApiResponse.errors.
 * Toasts and error handling are built around this shape.
 */
export type ErrorResponse = {
  status: number;
  title: string;
  detail: string;
  workflow_run_id?: number;
  source?: {
    pointer?: string;
    parameter?: string;
  };
};

export type LinksType = Record<string, string | null>;

/**
 * Standard API response shape.
 * - Success: use `data`.
 * - Errors from API: use `errors` (array of ErrorResponse).
 */
export type ApiResponse<T = unknown, L extends LinksType = LinksType> = {
  data?: T;
  status?: number;
  errors?: ErrorResponse[];
  links?: L;
  message?: string;
  id?: string;
};

/**
 * Type guard: response has API errors.
 */
export function hasApiErrors<T>(
  res: ApiResponse<T> | unknown,
): res is ApiResponse<T> & { errors: ErrorResponse[] } {
  return (
    typeof res === "object" &&
    res !== null &&
    "errors" in res &&
    Array.isArray((res as ApiResponse<unknown>).errors) &&
    (res as ApiResponse<unknown>).errors!.length > 0
  );
}

/**
 * Normalize an axios-like response (data + status) into ApiResponse<T>.
 * Use when the server returns { data, errors } in the body and you have status from res.status.
 */
export function toApiResponse<T>(
  data: unknown,
  status: number,
  errors?: ErrorResponse[],
): ApiResponse<T> {
  const body =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};
  return {
    data: (body.data as T) ?? (data as T),
    status,
    errors: errors ?? (body.errors as ErrorResponse[] | undefined),
    links: body.links as LinksType | undefined,
    message: body.message as string | undefined,
    id: body.id as string | undefined,
  };
}
