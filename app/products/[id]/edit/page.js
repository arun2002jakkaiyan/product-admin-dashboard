"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/axios";
import { isAuthenticated } from "../../../../lib/auth";

const LOCAL_PRODUCTS_KEY = "localProducts";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id;

  const [product, setProduct] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    brand: "",
    stock: "",
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // LOAD PRODUCT
  // ==========================================

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const localProducts =
          JSON.parse(
            localStorage.getItem(
              LOCAL_PRODUCTS_KEY
            ) || "[]"
          );

        const localProduct =
          localProducts.find(
            (item) =>
              String(item.id) ===
              String(productId)
          );

        if (localProduct) {
          setProduct(
            localProduct
          );

          setForm({
            title:
              localProduct.title ||
              "",
            description:
              localProduct.description ||
              "",
            price:
              localProduct.price ??
              "",
            category:
              localProduct.category ||
              "",
            brand:
              localProduct.brand ||
              "",
            stock:
              localProduct.stock ??
              "",
          });

          setLoading(false);
          return;
        }

        const response =
          await api.get(
            `/products/${productId}`
          );

        const data =
          response.data;

        setProduct(data);

        setForm({
          title:
            data.title || "",
          description:
            data.description ||
            "",
          price:
            data.price ?? "",
          category:
            data.category || "",
          brand:
            data.brand || "",
          stock:
            data.stock ?? "",
        });
      } catch (error) {
        console.error(
          "Failed to load product:",
          error
        );

        if (
          error.response?.status ===
          404
        ) {
          setError(
            "Product not found."
          );
        } else {
          setError(
            "Failed to load product."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ==========================================
  // SAVE PRODUCT
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.title.trim()) {
      setError(
        "Product title is required."
      );
      return;
    }

    if (!form.description.trim()) {
      setError(
        "Product description is required."
      );
      return;
    }

    if (
      !form.price ||
      Number(form.price) <= 0
    ) {
      setError(
        "Price must be greater than 0."
      );
      return;
    }

    if (!form.category.trim()) {
      setError(
        "Category is required."
      );
      return;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0
    ) {
      setError(
        "Stock cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);

      const updatedFields = {
        title:
          form.title.trim(),
        description:
          form.description.trim(),
        price:
          Number(form.price),
        category:
          form.category.trim(),
        brand:
          form.brand.trim(),
        stock:
          Number(form.stock),
      };

      let apiData = {};

      try {
        const response =
          await api.put(
            `/products/${productId}`,
            updatedFields
          );

        apiData =
          response.data || {};
      } catch (apiError) {
        console.error(
          "API update failed:",
          apiError
        );
      }

      const updatedProduct = {
        ...product,
        ...apiData,
        ...updatedFields,
        id:
          product?.id ??
          productId,
      };

      const localProducts =
        JSON.parse(
          localStorage.getItem(
            LOCAL_PRODUCTS_KEY
          ) || "[]"
        );

      const existingLocalIndex =
        localProducts.findIndex(
          (item) =>
            String(item.id) ===
            String(productId)
        );

      if (
        existingLocalIndex !== -1
      ) {
        localProducts[
          existingLocalIndex
        ] = updatedProduct;
      } else {
        localProducts.push(
          updatedProduct
        );
      }

      localStorage.setItem(
        LOCAL_PRODUCTS_KEY,
        JSON.stringify(
          localProducts
        )
      );

      console.log(
        "Updated product saved:",
        updatedProduct
      );

      router.push("/products");
    } catch (error) {
      console.error(
        "Failed to update product:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update product."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <p className="text-lg text-gray-700">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // PRODUCT NOT FOUND
  // ==========================================

  if (
    error &&
    !product
  ) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">

          <h1 className="mb-3 text-2xl font-bold text-gray-900">
            Product Not Found
          </h1>

          <p className="mb-6 text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/products"
              )
            }
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Products
          </button>

        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Product
            </h1>

            <p className="mt-1 text-gray-500">
              Update product information.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/products"
              )
            }
            disabled={saving}
            className="rounded-lg bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            ← Back to Products
          </button>

        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Product Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={5}
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Price
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="stock"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Stock
                </label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Category
              </label>

              <input
                id="category"
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="brand"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Brand
              </label>

              <input
                id="brand"
                name="brand"
                type="text"
                value={form.brand}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/products"
                  )
                }
                disabled={saving}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </main>
  );
}