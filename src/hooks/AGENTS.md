# Hooks

Call server functions with `{ data: payload }`. All hooks use `@tanstack/react-query`.

## Capabilities — `@/hooks/useCapabilities`

- **`useCapabilities()`** — `{ data: { databaseEnabled: boolean }, isLoading }`. Cached forever. Gate DB queries with `enabled: caps?.databaseEnabled === true`.

## Connectors — `@/hooks/useConnectors`

- **`useConnectors(params?)`** — list connectors.
- **`useConnector(id)`** — single connector.
- **`useQuerySource()`** — **mutation**. `mutate({ connectorId, payload: { query } })`. Key is `query`, not `sql`.
- **`usePaginatedQuerySource({ connectorId, query, perPage? })`** — auto-paginates. Do NOT add LIMIT/OFFSET.

## Workflows — `@/hooks/useWorkflows`

- **`useRunWorkflow(workflowId)`** — mutation.

## Chat — `@/hooks/useChatAssistant`

- **`useChatAssistant(workflowId)`** — `{ messages, sendMessage, isLoading, ready }`. Or use `<ChatAssistant workflowId={id} />` component.

## Auth — `@/hooks/useAuth`

- **`useSignIn()`** / **`useSignOut()`** / **`useGetUser()`** — platform API via tRPC.

## Helpers

- **`useAPIMutation({ mutationFn, successMessage?, onSuccessCallback? })`** — mutation with toasts.
- **`useIsMobile()`** — true when viewport < 768px.
