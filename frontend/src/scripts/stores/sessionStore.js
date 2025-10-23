export const sessionStore = {
  getToken: () => localStorage.getItem("token"),
  setToken: (t) => localStorage.setItem("token", t),
  clear: () => localStorage.removeItem("token"),
  isLoggedIn: () => !!localStorage.getItem("token"),
};
