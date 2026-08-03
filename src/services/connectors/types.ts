import type { ApiResponse, LinksType } from "@/services/common";

/**
 * Connector configuration is provider-specific; use a generic shape for type safety.
 */
export type ConnectorConfiguration = {
  host?: string;
  port?: string;
  schema?: string;
  database?: string;
  data_type?: string;
  credentials?: {
    password?: string;
    username?: string;
    auth_type?: string;
  };
};

export type ConnectorPayload = {
  connector_type: string;
  configuration: ConnectorConfiguration;
  name: string;
  connector_name: string;
};

export type CreateConnectorPayload = {
  connector: ConnectorPayload;
};

export type UpdateConnectorPayload = CreateConnectorPayload;

export type ListConnectorsParams = {
  type?: string;
  category?: string;
  page?: number;
  per_page?: number;
};

export type QuerySourcePayload = {
  /** SQL or query string. Use this key (not `sql`) when calling querySource / useQuerySource. */
  query: string;
};

export type ConnectorAttributes = {
  name: string;
  description: string | null;
  connector_type: "source" | "destination" | string;
  workspace_id: number;
  created_at: string;
  updated_at: string;
  configuration: ConnectorConfiguration;
  enabled: boolean;
  in_host: boolean;
  in_host_store_id: number | null;
  connector_name: string;
  icon: string | null;
};

export type ConnectorRecord = {
  id: string;
  type: "connectors" | string;
  attributes: ConnectorAttributes;
};

export type ConnectorLinks = LinksType & {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
};

export type ListConnectorsResponse = ApiResponse<
  ConnectorRecord[],
  ConnectorLinks
>;

export type ConnectorResponse = ApiResponse<ConnectorRecord>;

export type QuerySourceRow = Record<string, string | number | boolean>;

export type QuerySourceResponse = ApiResponse<QuerySourceRow[]>;
