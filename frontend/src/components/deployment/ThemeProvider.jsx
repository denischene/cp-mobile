import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ dark: false, toggle: () => {} });

export const useTheme = () => useContext(ThemeContext);

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem("confort-theme");
    if (stored === "dark" || stored === "light") return stored === "dark";
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
};

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("confort-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const handler = (e) => {
      const stored = localStorage.getItem("confort-theme");
      if (!stored) setDark(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
};
