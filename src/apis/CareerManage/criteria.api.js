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
    url: `/v1/careers-manage/career-criteria?${query}`,
    method: "GET",
  });
};

export const getById = (payload) => {
  return api.makeRequest({
    url: `/v1/careers-manage/career-criteria/${payload?.id}`,
    method: "GET",
  });
};

export const create = (payload) => {
  return api.makeRequest({
    url: `/v1/careers-manage/career-criteria`,
    method: "POST",
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const update = (payload) => {
  // Extract ID from FormData for URL
  const id = payload.get("id");

  return api.makeRequest({
    url: `/v1/careers-manage/career-criteria/${id}`,
    method: "PUT",
    data: payload,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const active = (payload) => {
  return api.makeRequest({
    url: `/v1/careers-manage/career-criteria/${payload?.id}/active`,
    method: "PUT",
  });
};

export const deleteItem = (payload) => {
  return api.makeRequest({
    url: `/v1/careers-manage/career-criteria/${payload?.id}`,
    method: "DELETE",
  });
};
