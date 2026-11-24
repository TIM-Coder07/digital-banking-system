import { baseApi } from "@/store/api/baseApi";
import type { ApiResponse, BankSettings } from "@/types";

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSettings: b.query<BankSettings, void>({
      query: () => "/settings",
      transformResponse: (r: ApiResponse<BankSettings>) => r.data,
      providesTags: ["Settings"],
    }),
    /** Money fields are sent in taka; the server converts to paisa. */
    updateSettings: b.mutation<BankSettings, BankSettings>({
      query: (body) => ({ url: "/settings", method: "PATCH", body }),
      transformResponse: (r: ApiResponse<BankSettings>) => r.data,
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
