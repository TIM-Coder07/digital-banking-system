import { baseApi } from "@/store/api/baseApi";
import type { ApiResponse } from "@/types";
import type { RegisterCustomerInput, SetPinInput } from "@/lib/validations/auth.schema";

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    register: b.mutation<{ _id: string }, RegisterCustomerInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (r: ApiResponse<{ _id: string }>) => r.data,
    }),
    setPin: b.mutation<{ updated: boolean }, SetPinInput>({
      query: (body) => ({ url: "/me/pin", method: "POST", body }),
      transformResponse: (r: ApiResponse<{ updated: boolean }>) => r.data,
    }),
  }),
});

export const { useRegisterMutation, useSetPinMutation } = authApi;
