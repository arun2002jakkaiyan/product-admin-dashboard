"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getProducts,
  searchProducts,
  deleteProduct,
} from "../../services/productServices";

import LogoutButton from "../../components/LogoutButton";
import { isAuthenticated } from "../../lib/auth";

const LOCAL_PRODUCTS_KEY = "localProducts";
const DELETED_PRODUCTS_KEY = "deletedProducts";

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ==================================================
  // URL VALUES
  // ==================================================

  const getValidNumber = (value, fallback) => {
    const number = Number(value);

    return Number.isFinite(number) && number > 0
      ? number
      : fallback;
  };

  const urlPage = getValidNumber(
    searchParams.get("page"),
    1
  );

  const urlLimit = [5, 10, 20, 30, 50].includes(
    Number(searchParams.get("limit"))
  )
    ? Number(searchParams.get("limit"))
    : 10;

  const urlSearch =
    searchParams.get("search") || "";

  const urlCategory =
    searchParams.get("category") || "all";

  const urlSort =
    searchParams.get("sort") || "default";

  // ==================================================
  // STATE
  // ==================================================

  const [products, setProducts] = useState([]);

  const [search, setSearch] =
    useState(urlSearch);

  const [category, setCategory] =
    useState(urlCategory);

  const [sort, setSort] =
    useState(urlSort);

  const [page, setPage] =
    useState(urlPage);

  const [limit, setLimit] =
    useState(urlLimit);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const searchRequestId =
    useRef(0);

  // ==================================================
  // LOCAL PRODUCTS
  // ==================================================

  const getLocalProducts = () => {
    try {
      const saved =
        localStorage.getItem(
          LOCAL_PRODUCTS_KEY
        );

      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      console.error(
        "Failed to read local products:",
        error
      );

      return [];
    }
  };

  // ==================================================
  // DELETED PRODUCT IDS
  // ==================================================

  const getDeletedProductIds = () => {
    try {
      const saved =
        localStorage.getItem(
          DELETED_PRODUCTS_KEY
        );

      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);

      return Array.isArray(parsed)
        ? parsed.map(String)
        : [];
    } catch (error) {
      console.error(
        "Failed to read deleted products:",
        error
      );

      return [];
    }
  };

  const saveDeletedProductIds = (ids) => {
    localStorage.setItem(
      DELETED_PRODUCTS_KEY,
      JSON.stringify(ids)
    );
  };

  // ==================================================
  // MERGE API + LOCAL PRODUCTS
  // ==================================================

  const mergeProducts = (
    apiProducts,
    localProducts,
    deletedIds
  ) => {
    const productMap = new Map();

    apiProducts.forEach((product) => {
      if (
        product?.id !== undefined &&
        !deletedIds.includes(
          String(product.id)
        )
      ) {
        productMap.set(
          String(product.id),
          product
        );
      }
    });

    localProducts.forEach((product) => {
      if (
        product?.id !== undefined &&
        !deletedIds.includes(
          String(product.id)
        )
      ) {
        productMap.set(
          String(product.id),
          product
        );
      }
    });

    return Array.from(
      productMap.values()
    );
  };

  // ==================================================
  // LOAD PRODUCTS
  // ==================================================

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    if (search.trim()) {
      return;
    }

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const skip =
          (page - 1) * limit;

        const data =
          await getProducts(
            limit,
            skip
          );

        const apiProducts =
          data.products || [];

        const localProducts =
          getLocalProducts();

        const deletedIds =
          getDeletedProductIds();

        const mergedProducts =
          mergeProducts(
            apiProducts,
            localProducts,
            deletedIds
          );

        setProducts(
          mergedProducts
        );

        const apiIds = new Set(
          apiProducts.map((product) =>
            String(product.id)
          )
        );

        const newLocalProducts =
          localProducts.filter(
            (product) =>
              !apiIds.has(
                String(product.id)
              ) &&
              !deletedIds.includes(
                String(product.id)
              )
          );

        const deletedApiCount =
          deletedIds.filter((id) =>
            apiIds.has(id)
          ).length;

        setTotal(
          Math.max(
            0,
            (data.total || 0) -
              deletedApiCount +
              newLocalProducts.length
          )
        );
      } catch (error) {
        console.error(
          "Failed to load products:",
          error
        );

        setError(
          "Failed to load products."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [
    router,
    page,
    limit,
    search,
  ]);

  // ==================================================
  // SEARCH
  // ==================================================

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    const trimmedSearch =
      search.trim();

    if (!trimmedSearch) {
      return;
    }

    const requestId =
      ++searchRequestId.current;

    const controller =
      new AbortController();

    const timer = setTimeout(
      async () => {
        try {
          setLoading(true);
          setError("");

          const skip =
            (page - 1) * limit;

          const data =
            await searchProducts(
              trimmedSearch,
              limit,
              skip,
              controller.signal
            );

          if (
            requestId !==
            searchRequestId.current
          ) {
            return;
          }

          const apiProducts =
            data.products || [];

          const localProducts =
            getLocalProducts();

          const deletedIds =
            getDeletedProductIds();

          const matchingLocalProducts =
            localProducts.filter(
              (product) => {
                if (
                  deletedIds.includes(
                    String(product.id)
                  )
                ) {
                  return false;
                }

                const query =
                  trimmedSearch.toLowerCase();

                const title =
                  product.title
                    ?.toLowerCase()
                    .includes(query);

                const categoryMatch =
                  product.category
                    ?.toLowerCase()
                    .includes(query);

                const brand =
                  product.brand
                    ?.toLowerCase()
                    .includes(query);

                return (
                  title ||
                  categoryMatch ||
                  brand
                );
              }
            );

          const mergedProducts =
            mergeProducts(
              apiProducts,
              matchingLocalProducts,
              deletedIds
            );

          setProducts(
            mergedProducts
          );

          const apiIds = new Set(
            apiProducts.map((product) =>
              String(product.id)
            )
          );

          const newLocalMatches =
            matchingLocalProducts.filter(
              (product) =>
                !apiIds.has(
                  String(product.id)
                )
            );

          const deletedApiCount =
            deletedIds.filter((id) =>
              apiIds.has(id)
            ).length;

          setTotal(
            Math.max(
              0,
              (data.total || 0) -
                deletedApiCount +
                newLocalMatches.length
            )
          );
        } catch (error) {
          if (
            error?.name ===
              "CanceledError" ||
            error?.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "Search error:",
            error
          );

          if (
            requestId ===
            searchRequestId.current
          ) {
            setError(
              "Failed to search products."
            );
          }
        } finally {
          if (
            requestId ===
            searchRequestId.current
          ) {
            setLoading(false);
          }
        }
      },
      500
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    search,
    page,
    limit,
  ]);

  // ==================================================
  // URL SYNCHRONIZATION
  // ==================================================

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    const params =
      new URLSearchParams();

    params.set(
      "page",
      String(page)
    );

    params.set(
      "limit",
      String(limit)
    );

    if (search.trim()) {
      params.set(
        "search",
        search.trim()
      );
    }

    if (category !== "all") {
      params.set(
        "category",
        category
      );
    }

    if (sort !== "default") {
      params.set(
        "sort",
        sort
      );
    }

    router.replace(
      `/products?${params.toString()}`,
      {
        scroll: false,
      }
    );
  }, [
    page,
    limit,
    search,
    category,
    sort,
    router,
  ]);

  // ==================================================
  // HANDLERS
  // ==================================================

  const handleSearchChange = (event) => {
    setSearch(
      event.target.value
    );

    setPage(1);
  };

  const handleCategoryChange = (event) => {
    setCategory(
      event.target.value
    );

    setPage(1);
  };

  const handleSortChange = (event) => {
    setSort(
      event.target.value
    );

    setPage(1);
  };

  const handleLimitChange = (event) => {
    setLimit(
      Number(event.target.value)
    );

    setPage(1);
  };

  const handleProductClick = (id) => {
    router.push(
      `/products/${id}`
    );
  };

  const handleEditProduct = (id) => {
    router.push(
      `/products/${id}/edit`
    );
  };

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  const handleDeleteProduct =
    async (productId) => {
      const product =
        products.find(
          (item) =>
            String(item.id) ===
            String(productId)
        );

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${
            product?.title ||
            "this product"
          }"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          productId
        );

        setError("");

        await deleteProduct(
          productId
        );

        const deletedIds =
          getDeletedProductIds();

        if (
          !deletedIds.includes(
            String(productId)
          )
        ) {
          deletedIds.push(
            String(productId)
          );
        }

        saveDeletedProductIds(
          deletedIds
        );

        const localProducts =
          getLocalProducts();

        const updatedLocalProducts =
          localProducts.filter(
            (item) =>
              String(item.id) !==
              String(productId)
          );

        localStorage.setItem(
          LOCAL_PRODUCTS_KEY,
          JSON.stringify(
            updatedLocalProducts
          )
        );

        setProducts(
          (currentProducts) =>
            currentProducts.filter(
              (item) =>
                String(item.id) !==
                String(productId)
            )
        );

        setTotal(
          (currentTotal) =>
            Math.max(
              0,
              currentTotal - 1
            )
        );

        if (
          products.length === 1 &&
          page > 1
        ) {
          setPage(
            (currentPage) =>
              currentPage - 1
          );
        }
      } catch (error) {
        console.error(
          "Failed to delete product:",
          error
        );

        setError(
          "Failed to delete product. Please try again."
        );
      } finally {
        setDeletingId(null);
      }
    };

  // ==================================================
  // CATEGORY FILTER
  // ==================================================

  const filteredProducts =
    category === "all"
      ? products
      : products.filter(
          (product) =>
            product.category ===
            category
        );

  // ==================================================
  // SORT
  // ==================================================

  const sortedProducts = [
    ...filteredProducts,
  ].sort((a, b) => {
    switch (sort) {
      case "price-low":
        return (
          Number(a.price || 0) -
          Number(b.price || 0)
        );

      case "price-high":
        return (
          Number(b.price || 0) -
          Number(a.price || 0)
        );

      case "rating-high":
        return (
          Number(b.rating || 0) -
          Number(a.rating || 0)
        );

      case "stock-high":
        return (
          Number(b.stock || 0) -
          Number(a.stock || 0)
        );

      case "name-az":
        return (
          a.title || ""
        ).localeCompare(
          b.title || ""
        );

      case "name-za":
        return (
          b.title || ""
        ).localeCompare(
          a.title || ""
        );

      default:
        return 0;
    }
  });

  // ==================================================
  // PAGINATION
  // ==================================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        total / limit
      )
    );

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(
        (currentPage) =>
          currentPage - 1
      );
    }
  };

  const goToNextPage = () => {
    if (
      page <
      totalPages
    ) {
      setPage(
        (currentPage) =>
          currentPage + 1
      );
    }
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="rounded-xl bg-white px-8 py-6 shadow">
            <p className="text-lg font-medium text-gray-700">
              Loading products...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (
    error &&
    products.length === 0
  ) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="mb-5 text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Product Admin Dashboard
              </h1>

              <p className="mt-2 text-gray-500">
                Total products: {total}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/products/new"
                  )
                }
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                + Add Product
              </button>

              <LogoutButton />

            </div>

          </div>

        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">

          <div className="grid gap-5 md:grid-cols-3">

            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Search
              </label>

              <input
                id="search"
                type="text"
                value={search}
                onChange={
                  handleSearchChange
                }
                placeholder="Search products..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Category
              </label>

              <select
                id="category"
                value={category}
                onChange={
                  handleCategoryChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
              >
                <option value="all">
                  All Categories
                </option>

                <option value="beauty">
                  Beauty
                </option>

                <option value="fragrances">
                  Fragrances
                </option>

                <option value="furniture">
                  Furniture
                </option>

                <option value="groceries">
                  Groceries
                </option>

                <option value="home-decoration">
                  Home Decoration
                </option>

                <option value="kitchen-accessories">
                  Kitchen Accessories
                </option>

                <option value="laptops">
                  Laptops
                </option>

                <option value="mens-shirts">
                  Men's Shirts
                </option>

                <option value="mens-shoes">
                  Men's Shoes
                </option>

                <option value="mens-watches">
                  Men's Watches
                </option>

                <option value="mobile-accessories">
                  Mobile Accessories
                </option>

                <option value="motorcycle">
                  Motorcycle
                </option>

                <option value="skin-care">
                  Skin Care
                </option>

                <option value="smartphones">
                  Smartphones
                </option>

                <option value="sports-accessories">
                  Sports Accessories
                </option>

                <option value="sunglasses">
                  Sunglasses
                </option>

                <option value="tablets">
                  Tablets
                </option>

                <option value="tops">
                  Tops
                </option>

                <option value="vehicle">
                  Vehicle
                </option>

                <option value="womens-bags">
                  Women's Bags
                </option>

                <option value="womens-dresses">
                  Women's Dresses
                </option>

                <option value="womens-jewellery">
                  Women's Jewellery
                </option>

                <option value="womens-shoes">
                  Women's Shoes
                </option>

                <option value="womens-watches">
                  Women's Watches
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sort"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Sort By
              </label>

              <select
                id="sort"
                value={sort}
                onChange={
                  handleSortChange
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
              >
                <option value="default">
                  Default
                </option>

                <option value="price-low">
                  Price: Low to High
                </option>

                <option value="price-high">
                  Price: High to Low
                </option>

                <option value="rating-high">
                  Rating: High to Low
                </option>

                <option value="stock-high">
                  Stock: High to Low
                </option>

                <option value="name-az">
                  Name: A to Z
                </option>

                <option value="name-za">
                  Name: Z to A
                </option>
              </select>
            </div>

          </div>

        </section>

        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-gray-600">
            Showing{" "}
            {total === 0
              ? 0
              : (page - 1) *
                  limit +
                1}
            {" - "}
            {Math.min(
              page * limit,
              total
            )}
            {" "}of {total} products
          </p>

          <div className="flex items-center gap-2">

            <label
              htmlFor="limit"
              className="text-sm text-gray-600"
            >
              Per page:
            </label>

            <select
              id="limit"
              value={limit}
              onChange={
                handleLimitChange
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value={5}>
                5
              </option>

              <option value={10}>
                10
              </option>

              <option value={20}>
                20
              </option>

              <option value={30}>
                30
              </option>

              <option value={50}>
                50
              </option>
            </select>

          </div>

        </div>

        {sortedProducts.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

            <h2 className="text-xl font-semibold text-gray-900">
              No products found
            </h2>

            <p className="mt-2 text-gray-500">
              Try changing your search or category.
            </p>

          </div>
        ) : (
          <>

            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Image
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Title
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Price
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Rating
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Stock
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200">

                  {sortedProducts.map(
                    (product, index) => (
                      <tr
                        key={`${product.id}-${index}`}
                        className="transition hover:bg-gray-50"
                      >

                        <td className="px-6 py-4">

                          <img
                            src={
                              product.thumbnail
                            }
                            alt={
                              product.title
                            }
                            className="h-16 w-16 rounded-lg object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />

                        </td>

                        <td
                          className="cursor-pointer px-6 py-4 font-semibold text-gray-900"
                          onClick={() =>
                            handleProductClick(
                              product.id
                            )
                          }
                        >
                          {
                            product.title
                          }
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {
                            product.category
                          }
                        </td>

                        <td className="px-6 py-4 font-medium text-gray-700">
                          $
                          {
                            product.price
                          }
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {
                            product.rating ??
                            "-"
                          }
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {
                            product.stock ??
                            "-"
                          }
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleEditProduct(
                                  product.id
                                )
                              }
                              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={
                                deletingId ===
                                product.id
                              }
                              onClick={() =>
                                handleDeleteProduct(
                                  product.id
                                )
                              }
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId ===
                              product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="space-y-4 md:hidden">

              {sortedProducts.map(
                (product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="rounded-2xl bg-white p-5 shadow-sm"
                  >

                    <div
                      className="flex cursor-pointer gap-4"
                      onClick={() =>
                        handleProductClick(
                          product.id
                        )
                      }
                    >

                      <img
                        src={
                          product.thumbnail
                        }
                        alt={
                          product.title
                        }
                        className="h-24 w-24 rounded-lg object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                      <div className="flex-1">

                        <h2 className="font-semibold text-gray-900">
                          {
                            product.title
                          }
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            product.category
                          }
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">

                      <div>
                        <p className="text-xs text-gray-500">
                          Price
                        </p>

                        <p className="font-semibold">
                          $
                          {
                            product.price
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Rating
                        </p>

                        <p className="font-semibold">
                          {
                            product.rating ??
                            "-"
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Stock
                        </p>

                        <p className="font-semibold">
                          {
                            product.stock ??
                            "-"
                          }
                        </p>
                      </div>

                    </div>

                    <div className="mt-4 flex gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          handleEditProduct(
                            product.id
                          )
                        }
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          product.id
                        }
                        onClick={() =>
                          handleDeleteProduct(
                            product.id
                          )
                        }
                        className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId ===
                        product.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">

                <button
                  type="button"
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    page === 1
                  }
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm font-medium text-gray-600">
                  Page {page} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  onClick={
                    goToNextPage
                  }
                  disabled={
                    page ===
                    totalPages
                  }
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>

              </div>
            )}

          </>
        )}

      </div>
    </main>
  );
}