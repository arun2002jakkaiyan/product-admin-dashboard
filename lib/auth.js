export const isAuthenticated = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const token = localStorage.getItem("authToken");

  return Boolean(token);
};

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("authToken");
};

export const logout = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("authToken");
};