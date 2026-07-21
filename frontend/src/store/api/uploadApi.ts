// src/store/api/uploadApi.ts
import { baseApi } from "./baseApi";

export type UploadCategory = "player_photo" | "team_logo" | "team_banner";

export interface UploadImageResult {
  url: string;
  publicId: string;
}

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadImage: builder.mutation<UploadImageResult, { file: File; category: UploadCategory }>({
      query: ({ file, category }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);
        return { url: "/uploads/image", method: "POST", body: formData };
      },
      transformResponse: (res: { data: UploadImageResult }) => res.data,
    }),
  }),
});

export const { useUploadImageMutation } = uploadApi;