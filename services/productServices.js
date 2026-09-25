import api from "../lib/axios";

export const getProducts = async (limit = 10, skip = 0) => {
  const response = await api.get("/products", {
    params: {
      limit,
      skip,
    },
  });

  return response.data;
};

export const searchProducts = async (
  query,
  limit = 10,
  skip = 0,
  signal
) => {
  const response = await api.get("/products/search", {
    params: {
      q: query,
      limit,
      skip,
    },
    signal,
  });

  return response.data;
};

export const getCategories = async () => {
  const response = await api.get("/products/category-list");

  return response.data;
};

// CREATE PRODUCT
export const createProduct = async (productData) => {
  const response = await api.post(
    "/products/add",
    productData
  );

  return response.data;
};

// UPDATE PRODUCT
export const updateProduct = async (id, productData) => {
  const response = await api.put(
    `/products/${id}`,
    productData
  );

  return response.data;
};

// DELETE PRODUCT
export const deleteProduct = async (productId) => {
  const response = await api.delete(
    `/products/${productId}`
  );

  return response.data;
};