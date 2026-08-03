export type RunWorkflowPayload = {
  workflow: {
    inputs: Record<string, unknown>;
  };
};

export type RunWorkflowResponse = {
  workflow_run_id?: string;
  temporal_workflow_id?: number | string | null;
  output?: {
    type?: "text" | "json" | "chart" | "table" | string;
    data?: {
      message?: string;
    };
  } | null;
  data?: object | string | number | boolean;
};

/** Data App credentials extracted from a workflow's published config. */
export type DataAppConfig = {
  dataAppId: string;
  dataAppToken: string;
};

/** Flat DataAppSession after unwrapping JSON:API envelope. */
export type DataAppSession = {
  id: number;
  title?: string;
  session_id: string;
  data_app_id: number;
  workspace_id: number;
  created_at?: string;
  updated_at?: string;
};

/** Flat ChatMessage after unwrapping JSON:API envelope. */
export type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  workspace_id: number;
  visual_component_id?: number | null;
  data_app_session_id?: number | null;
  workflow_session_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type WorkflowInterfaceAvatar = {
  type?: "image" | string;
  value?: string;
};

export type WorkflowInterfaceProperties = {
  field_group?: string;
  measure_value?: string;
  card_title?: string;
  visual_color?: string;
  file_id?: string;
  file_name?: string;
  chat_bot?: {
    welcome_message?: string;
    responder_name?: string;
    avatar?: WorkflowInterfaceAvatar;
  };
  show_visual?: boolean;
};

export type WorkflowInterfaceConfig = {
  component_type?: "chat_bot" | string;
  configurable_id?: string;
  configurable_type?: "workflow" | string;
  properties?: WorkflowInterfaceProperties;
} & Partial<DataAppConfig>;

export type WorkflowComponent = {
  id: string;
  name: string;
  component_category: string;
  component_type: string;
  configuration: Record<string, string | number | boolean | object>;
  position: { x: number; y: number };
  data: Record<string, string | number | boolean | object>;
  created_at: string;
  updated_at: string;
};

export type WorkflowAccessControl = {
  allowed_role_ids?: number[];
  allowed_users?: Array<string | number>;
};

export type Workflow = {
  id: string;
  type: "agents-workflows" | string;
  attributes: {
    name: string;
    description: string;
    status: "draft" | "published" | string;
    trigger_type:
      | "website_chatbot"
      | "chat_assistant"
      | "scheduled"
      | "api_trigger"
      | "slack"
      | string
      | null;
    configuration: {
      interface?: WorkflowInterfaceConfig;
      components?: WorkflowComponent[];
      edges?: Array<Record<string, string | number | boolean | object>>;
    };
    components?: WorkflowComponent[];
    edges?: Array<Record<string, string | number | boolean | object>>;
    access_control_enabled?: boolean;
    access_control?: WorkflowAccessControl;
    token: string | null;
    created_at: string;
    updated_at: string;
    version_number: number;
  };
};
