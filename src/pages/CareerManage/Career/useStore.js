import { create } from "zustand";
import * as api from "../../../apis/CareerManage/career.api";
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

        // Optional fields
        if (data.description) {
          formData.append("description", data.description);
        }

        if (data.tags) {
          formData.append("tags", data.tags);
        }

        // Boolean field - default to true if not specified
        formData.append(
          "is_active",
          data.is_active !== undefined ? data.is_active : true
        );

        // Image file (background_image)
        if (data.image_file && data.image_file instanceof File) {
          formData.append("background_image", data.image_file);
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
