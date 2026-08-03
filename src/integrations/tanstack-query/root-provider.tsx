/**
 * Router context helper for TanStack Query integration.
 * The QueryClient is created inside getRouter() in src/router.tsx and provided
 * via both router context and the router's Wrap (QueryClientProvider).
 * This module is kept for backward-compat imports from __root.tsx.
 */

export { QueryClient } from "@tanstack/react-query";
