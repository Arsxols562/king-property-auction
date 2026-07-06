import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PropertyFormData, QueryParams } from "@/app/types/api";
import { apiClient } from "@/lib/apiClient";

export const usePropertyApi = () => {
  const queryClient = useQueryClient();

  const useGetProperties = (params?: QueryParams) => {
    return useQuery<any>({
      queryKey: ["properties", params?.page, params?.search, params?.type, params?.status, params?.approvalStatus],
      queryFn: async () => {
        const query = new URLSearchParams();
        if (params?.page) query.set("page", String(params.page));
        if (params?.pageSize) query.set("limit", String(params.pageSize));
        if (params?.status) query.set("status", params.status);
        if (params?.approvalStatus)
          query.set("approvalStatus", params.approvalStatus);
        if (params?.auctionSlug) query.set("auctionSlug", params.auctionSlug);
        if (params?.listingType) query.set("listingType", params.listingType);
        if (params?.type) query.set("type", params.type);
        if (params?.search) query.set("search", params.search);
        if (params?.location) query.set("city", params.location);
        if (params?.minPrice) query.set("minPrice", params.minPrice);
        if (params?.maxPrice) query.set("maxPrice", params.maxPrice);
        if (params?.minBeds) query.set("minBeds", params.minBeds);
        if (params?.maxBeds) query.set("maxBeds", params.maxBeds);
        if (params?.excludeSold) query.set("excludeSold", params.excludeSold);
        const result = await apiClient.fetch(`/properties?${query}`);
        if (!result.success) throw new Error(result.message);
        return {
          success: true,
          data: result.data || [],
          total: result.pagination?.total || 0,
          page: result.pagination?.page || 1,
          pageSize: result.pagination?.limit || 10,
          totalPages: result.pagination?.pages || 0,
        };
      },
    });
  };

  const useGetPropertyById = (id: string) => {
    return useQuery<any>({
      queryKey: ["properties", id],
      queryFn: async () => {
        const result = await apiClient.fetch(`/properties/${id}`);
        if (!result.success) throw new Error(result.message);
        return result.data;
      },
      enabled: !!id,
    });
  };

  const useCreateProperty = () => {
    return useMutation({
      mutationFn: async (data: PropertyFormData) => {
        const result = await apiClient.fetch("/properties", {
          method: "POST",
          body: JSON.stringify(data),
        });
        if (!result.success) throw new Error(result.message);
        return result;
      },
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
    });
  };

  const useUpdateProperty = () => {
    return useMutation({
      mutationFn: async ({
        id,
        data,
      }: {
        id: string;
        data: Partial<PropertyFormData>;
      }) => {
        const result = await apiClient.fetch(`/properties/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        if (!result.success) throw new Error(result.message);
        return result;
      },
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
    });
  };

  const useDeleteProperty = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const result = await apiClient.fetch(`/properties/${id}`, {
          method: "DELETE",
        });
        if (!result.success) throw new Error(result.message);
        return result;
      },
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
    });
  };

  const useUploadPropertyImages = () => {
    return useMutation({
      mutationFn: async (files: File[]) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("propertyImages", file));
        const result = await apiClient.upload("/upload/images", formData);
        if (!result.success) throw new Error(result.message);
        return result;
      },
    });
  };

  const useApproveProperty = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const result = await apiClient.fetch(`/properties/${id}/approve`, {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        });
        if (!result.success) throw new Error(result.message);
        return result;
      },
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
    });
  };

  const useRejectProperty = () => {
    return useMutation({
      mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
        const result = await apiClient.fetch(`/properties/${id}/approve`, {
          method: "PATCH",
          body: JSON.stringify({ status: "rejected" }),
        });
        if (!result.success) throw new Error(result.message);
        return { ...result, reason };
      },
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: ["properties"] }),
    });
  };

  return {
    useGetProperties,
    useGetPropertyById,
    useCreateProperty,
    useUpdateProperty,
    useDeleteProperty,
    useUploadPropertyImages,
    useApproveProperty,
    useRejectProperty,
  };
};
