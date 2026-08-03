import type { ErrorResponse } from "../common";

export type SignInPayload = {
  email: string;
  password: string;
  embedded?: boolean;
  token?: boolean;
};

export type SignInResponse = {
  type: string;
  id: string;
  attributes: {
    token: string;
  };
  errors?: ErrorResponse[];
};

export type LogoutResponse = {
  type: "message" | string;
  id: string;
  attributes: {
    message: string;
  };
};

export type UserResponse = {
  id: string;
  type: string;
  attributes: {
    name: string;
    email: string;
    created_at: string;
    status?: string | null;
    eula_accepted?: boolean;
    invitation_created_at?: string | null;
    invitation_due_at?: string | null;
    email_verification_enabled?: boolean;
    role: "Admin" | "Viewer" | "Member" | string;
  };
};
