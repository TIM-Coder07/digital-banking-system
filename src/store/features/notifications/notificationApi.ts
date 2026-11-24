import { baseApi } from "@/store/api/baseApi";
import type { ApiResponse, AppNotification } from "@/types";

type NotificationList = { items: AppNotification[]; unread: number };

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getNotifications: b.query<NotificationList, void>({
      query: () => "/notifications",
      transformResponse: (r: ApiResponse<NotificationList>) => r.data,
      providesTags: ["Notification"],
    }),
    markAllRead: b.mutation<{ updated: boolean }, void>({
      query: () => ({ url: "/notifications", method: "PATCH" }),
      transformResponse: (r: ApiResponse<{ updated: boolean }>) => r.data,
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkAllReadMutation } = notificationApi;
