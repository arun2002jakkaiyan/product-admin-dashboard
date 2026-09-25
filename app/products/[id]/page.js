"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/axios";
import { isAuthenticated } from "../../../lib/auth";

const LOCAL_PRODUCTS_KEY = "localProducts";
const DELETED_PRODUCTS_KEY = "deletedProducts";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        // Check deleted products
        const deletedProducts = JSON.parse(
          localStorage.getItem(DELETED_PRODUCTS_KEY) || "[]"
        );

        if (
          deletedProducts
            .map(String)
            .includes(String(productId))
        ) {
          setError("Product not found.");
          setLoading(false);
          return;
        }

        // Check locally created products
        const localProducts = JSON.parse(
          localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]"
        );

        const localProduct = localProducts.find(
          (item) => String(item.id) === String(productId)
        );

        if (localProduct) {
          setProduct(localProduct);
          setLoading(false);
          return;
        }

        // Load from API
        const response = await api.get(
          `/products/${productId}`
        );

        setProduct(response.data);
      } catch (error) {
        console.error(
          "Failed to load product:",
          error
        );

        if (error.response?.status === 404) {
          setError("Product not found.");
        } else {
          setError("Failed to load product.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="rounded-2xl bg-white px-10 py-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

            <p className="text-lg font-semibold text-gray-700">
              Loading product...
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Please wait
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !product) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
              !
            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              Product Not Found
            </h1>

            <p className="mt-3 leading-6 text-gray-500">
              {error || "This product could not be found."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/products")}
              className="mt-7 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              ← Back to Products
            </button>

          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // PRODUCT IMAGE
  // ==========================================

  const productImage =
    product.thumbnail ||
    product.images?.[0];

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ======================================
            HEADER
        ====================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Product Management
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Product Details
            </h1>

            <p className="mt-1 text-gray-500">
              View complete product information.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <button
              type="button"
              onClick={() => router.push("/products")}
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ← Back to Products
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/products/${productId}/edit`
                )
              }
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Edit Product
            </button>

          </div>

        </div>

        {/* ======================================
            MAIN PRODUCT CARD
        ====================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* ====================================
              IMAGE
          ==================================== */}

          <div className="flex min-h-[360px] items-center justify-center bg-gray-50 p-8 sm:min-h-[420px]">

            {productImage ? (
              <img
                src={productImage}
                alt={product.title}
                className="max-h-[360px] max-w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-200 text-3xl text-gray-400">
                  📦
                </div>

                <p className="mt-4 font-medium text-gray-500">
                  No product image available
                </p>
              </div>
            )}

          </div>

          {/* ====================================
              PRODUCT INFORMATION
          ==================================== */}

          <div className="p-6 sm:p-8 lg:p-10">

            {/* Product title */}

            <div className="border-b border-gray-200 pb-7">

              <div className="flex flex-wrap items-center gap-3">

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-600">
                  {product.category || "Product"}
                </span>

                {product.brand && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                    {product.brand}
                  </span>
                )}

              </div>

              <h2 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                {product.title}
              </h2>

              {product.brand && (
                <p className="mt-3 text-gray-500">
                  Brand:
                  <span className="ml-1 font-semibold text-gray-700">
                    {product.brand}
                  </span>
                </p>
              )}

            </div>

            {/* ==================================
                SUMMARY CARDS
            ================================== */}

            <div className="grid gap-4 border-b border-gray-200 py-7 sm:grid-cols-3">

              {/* PRICE */}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                <p className="text-sm font-medium text-gray-500">
                  Price
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {product.price != null
                    ? `$${Number(product.price).toFixed(2)}`
                    : "-"}
                </p>

              </div>

              {/* RATING */}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                <p className="text-sm font-medium text-gray-500">
                  Rating
                </p>

                <div className="mt-2 flex items-center gap-2">

                  <span className="text-2xl">
                    ⭐
                  </span>

                  <span className="text-2xl font-bold text-gray-900">
                    {product.rating ?? "-"}
                  </span>

                </div>

              </div>

              {/* STOCK */}

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

                <p className="text-sm font-medium text-gray-500">
                  Stock
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {product.stock ?? "-"}
                </p>

              </div>

            </div>

            {/* ==================================
                DESCRIPTION
            ================================== */}

            <div className="border-b border-gray-200 py-7">

              <h3 className="text-xl font-bold text-gray-900">
                Description
              </h3>

              <p className="mt-3 max-w-4xl leading-7 text-gray-600">
                {product.description ||
                  "No description available."}
              </p>

            </div>

            {/* ==================================
                ADDITIONAL INFORMATION
            ================================== */}

            <div className="py-7">

              <h3 className="text-xl font-bold text-gray-900">
                Additional Information
              </h3>

              <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">

                {/* CATEGORY */}

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Category
                  </p>

                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {product.category || "-"}
                  </p>
                </div>

                {/* BRAND */}

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Brand
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {product.brand || "-"}
                  </p>
                </div>

                {/* DISCOUNT */}

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Discount
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {product.discountPercentage != null
                      ? `${product.discountPercentage}%`
                      : "-"}
                  </p>
                </div>

                {/* PRODUCT ID */}

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Product ID
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {product.id}
                  </p>
                </div>

              </div>

            </div>

            {/* ==================================
                BOTTOM ACTIONS
            ================================== */}

            <div className="flex flex-col gap-3 border-t border-gray-200 pt-7 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => router.push("/products")}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back to Products
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/products/${productId}/edit`
                  )
                }
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                Edit Product
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}