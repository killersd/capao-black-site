import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editor, setEditor] = useState(null); // { section, focusId }

  useEffect(() => {
    api.content().then(setContent).catch((e) => setError(e.message));
    if (getToken()) {
      api
        .me()
        .then(() => setIsAdmin(true))
        .catch(() => setToken(null));
    }
  }, []);

  const login = useCallback(async (user, password) => {
    const { token } = await api.login(user, password);
    setToken(token);
    setIsAdmin(true);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setIsAdmin(false);
    setEditor(null);
  }, []);

  const save = useCallback(async (section, value) => {
    try {
      const res = await api.save(section, value);
      setContent((c) => ({ ...c, [section]: res.value }));
      return res.value;
    } catch (e) {
      if (e.status === 401) logout();
      throw e;
    }
  }, [logout]);

  const openEditor = useCallback((section, focusId) => setEditor({ section, focusId }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const value = useMemo(
    () => ({ content, error, isAdmin, login, logout, save, editor, openEditor, closeEditor }),
    [content, error, isAdmin, login, logout, save, editor, openEditor, closeEditor],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);
