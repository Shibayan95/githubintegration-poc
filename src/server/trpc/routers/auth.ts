import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/integrations/trpc/init";
import { apiFetch } from "@/server/platform/apiFetch";
import { deleteAppAuthCookie, setAppAuthCookie } from "@/server/authCookie";
import type { ApiResponse } from "@/services/common";
import type { SignInResponse, UserResponse } from "@/services/auth/types";

const signInInput = z.object({
  email: z.email(),
  password: z.string().min(1),
  embedded: z.boolean().optional(),
  token: z.boolean().optional(),
});

export const authRouter = createTRPCRouter({
  signIn: publicProcedure
    .input(signInInput)
    .mutation(async ({ ctx, input }) => {
      const { embedded, ...credentials } = input;
      const res = await apiFetch<
        typeof credentials,
        ApiResponse<SignInResponse>
      >(ctx, {
        url: "login",
        method: "POST",
        data: {
          ...credentials,
          token: true
        },
      });

      const token = res.data?.attributes.token;
      if (token) {
        setAppAuthCookie(token, embedded ? "none" : "lax");
      }
      return res;
    }),

  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    deleteAppAuthCookie();
    return apiFetch<
      undefined,
      ApiResponse<{ type: string; id: string; attributes: { message: string } }>
    >(ctx, { url: "logout", method: "DELETE" });
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return apiFetch<undefined, ApiResponse<UserResponse>>(ctx, {
      url: "users/me",
      method: "GET",
    });
  }),
});
