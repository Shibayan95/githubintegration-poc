import { useCallback } from "react";
import { toast } from "sonner";
import type { ErrorResponse } from "@/services/common";

/**
 * Show a generic error toast. Use when isError is true and optionally when data/isFetched indicate an error state.
 */
export function useErrorToast() {
  const showErrorToast = useCallback(
    (
      message: string,
      isError?: boolean,
      _data?: unknown,
      isFetched?: boolean,
    ) => {
      if (isError ?? isFetched) {
        toast.error(message);
      }
    },
    [],
  );
  return { showErrorToast };
}

/**
 * Show one toast per API error (error.detail). Use when ApiResponse.errors is present.
 */
export function useAPIErrorsToast() {
  const showAPIErrorsToast = useCallback(
    (errors: ErrorResponse[], _width?: number, _maxWidth?: number) => {
      if (!Array.isArray(errors) || errors.length === 0) return;
      for (const err of errors) {
        const message = err.detail || err.title || "An error occurred";
        toast.error(message);
      }
    },
    [],
  );
  return { showAPIErrorsToast };
}
