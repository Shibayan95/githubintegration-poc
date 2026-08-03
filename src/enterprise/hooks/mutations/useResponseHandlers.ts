import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { hasApiErrors } from "@/services/common";
import { useAPIErrorsToast } from "@/hooks/useErrorToast";

/**
 * Shared success/error handling for enterprise mutations that use raw useMutation.
 * Use in domain mutation hooks (e.g. useAgentMutations, useToolMutations): call
 * handleOnSuccess in onSuccess and handleOnError in onError.
 */
export function useResponseHandlers() {
  const queryClient = useQueryClient();
  const { showAPIErrorsToast } = useAPIErrorsToast();

  const handleOnSuccess = useCallback(
    (data: unknown, toastMessage?: string, queryKey?: readonly unknown[]) => {
      if (hasApiErrors(data)) {
        showAPIErrorsToast(data.errors);
        return;
      }
      if (queryKey?.length) {
        queryClient.invalidateQueries({ queryKey: [...queryKey] });
      }
      if (toastMessage) {
        toast.success(toastMessage);
      }
    },
    [queryClient, showAPIErrorsToast],
  );

  const handleOnError = useCallback((message: string) => {
    toast.error(message);
  }, []);

  return { handleOnSuccess, handleOnError };
}
