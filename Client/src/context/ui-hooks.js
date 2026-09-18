import { createContext, useContext } from "react";
export const UIContext = createContext(null);
export function useUI() {
  const value = useContext(UIContext);
  if (!value) throw new Error("useUI must be used inside UIProvider");
  return value;
}
export function useToast() { return useUI().toast; }
