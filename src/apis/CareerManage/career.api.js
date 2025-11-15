import createAPIServices from "../base.api";
import { buildQueryString } from "../../utils/func";
const api = createAPIServices();

export const getAll = (payload) => {
  const query = buildQueryString({
    limit: payload?.limit,
    page: payload?.page,
    filters: payload?.filters || {},
  });

  return api.makeRequest({
    url: `/v1/careers-manage/careers?${query}`,
    method: "GET",
  });
};

export const getById = (payload) => {
  return api.makeRequest({
    url: `/v1/careers-manage/careers/${payload}`,
    method: "GET",
  });
};

export const create = (payload) => {
  // Extract id from FormData if exists for URL (shouldn't exist for create)
  return api.makeRequest({
    url: `/v1/careers-manage/careers`,
    method: "POST",
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const update = (payload) => {
  // Extract id from FormData for URL
  let id = null;
  if (payload instanceof FormData) {
    id = payload.get("id");
  } else {
    id = payload?.id;
  }

  return api.makeRequest({
    url: `/v1/careers-manage/careers/${id}`,
    method: "PUT",
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const active = (payload) => {
  return api.makeRequest({
    url: `/v1/careers-manage/careers/${payload?.id}/active`,
    method: "PUT",
  });
};

export const deleteItem = (payload) => {
  return api.makeRequest({
    url: `/v1/careers-manage/careers/${payload?.id}`,
    method: "DELETE",
  });
};
