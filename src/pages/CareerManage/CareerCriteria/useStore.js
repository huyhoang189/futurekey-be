import { create } from "zustand";
import * as api from "../../../apis/CareerManage/criteria.api";
import { ACTION_NAME } from "../../../utils/common";

const baseInitialState = {
  records: [],
  selectedRecord: {},
  isLoading: false,
  errorMessage: false,
  limit: 10,
  total: 0,
  page: 1,
  modalActive: false,
  filters: {},
};

export const useStore = create((set, get) => ({
  //Initial State
  ...baseInitialState,

  //Actions
  reset: () => set(baseInitialState),
  toggleModal: (payload) =>
    set((state) => ({
      modalActive: !state.modalActive,
      selectedRecord: payload == null ? {} : payload,
    })),

  getRecords: async (payload) => {
    set({ isLoading: true, errorMessage: false });
    try {
      const { data, status } = await api.getAll(payload);
      if (status === 200 || status === 201) {
        set({
          records: data.data,
          total: data.meta.total,
          page: data.meta.page,
          isLoading: false,
          modalActive: false,
        });
      } else {
        set({ isLoading: false, errorMessage: "Error", modalActive: false });
      }
    } catch (error) {
      set({ isLoading: false, errorMessage: "Error", modalActive: false });
    }
  },
  getRecordById: async (payload) => {
    set({ errorMessage: false });
    try {
      const { data, status } = await api.getById(payload);
      if (status === 200 || status === 201) {
        set({ selectedRecord: data.data });
      } else {
        set({ errorMessage: "Error" });
      }
    } catch (error) {
      set({ errorMessage: "Error" });
    } finally {
      set({ modalActive: false });
    }
  },
  handleRecord: async (payload) => {
    set({ isLoading: true, errorMessage: false });
    try {
      const { limit, page, item, actionName, filters } = payload;

      // Prepare FormData for CREATE and UPDATE
      const prepareFormData = (data) => {
        const formData = new FormData();

        // Required field
        if (data.name) {
          formData.append("name", data.name);
        }

        // Career ID (required - from URL params)
        if (data.career_id) {
          formData.append("career_id", data.career_id);
        }

        // Optional fields
        if (data.description) {
          formData.append("description", data.description);
        }

        if (data.order_index !== undefined && data.order_index !== null) {
          formData.append("order_index", data.order_index);
        }

        // Boolean field - default to true if not specified
        formData.append(
          "is_active",
          data.is_active !== undefined ? data.is_active : true
        );

        // Video thumbnail file
        if (
          data.video_thumbnail_file &&
          data.video_thumbnail_file instanceof File
        ) {
          formData.append("video_thumbnail", data.video_thumbnail_file);
        }

        // Video file
        if (data.video_file && data.video_file instanceof File) {
          formData.append("video", data.video_file);
        }

        // Attachments (multiple files)
        if (data.attachments && Array.isArray(data.attachments)) {
          data.attachments.forEach((file, index) => {
            if (file.originFileObj && file.originFileObj instanceof File) {
              formData.append(`attachments`, file.originFileObj);
            }
          });
        }

        // For UPDATE, include id
        if (data.id) {
          formData.append("id", data.id);
        }

        return formData;
      };

      const actionMap = {
        [ACTION_NAME.CREATE]: () => api.create(prepareFormData(item)),
        [ACTION_NAME.UPDATE]: () => api.update(prepareFormData(item)),
        [ACTION_NAME.DELETE]: () => api.deleteItem({ id: item.id }),
        [ACTION_NAME.ACTIVE]: () => api.active({ id: item.id }),
      };

      const { data, status } = await actionMap[actionName]();
      if (status === 200 || status === 201) {
        set({ isLoading: false });
      } else {
        set({ isLoading: false, errorMessage: "Error" });
      }

      await get().getRecords({ page, limit, filters });
    } catch (error) {
      set({ isLoading: false, errorMessage: "Error" });
      console.log("error", error);
    }
  },
  updateSelectedRecordInput: (payload) => set({ selectedRecord: payload }),
  updateFilters: (payload) => set({ filters: payload }),
}));
