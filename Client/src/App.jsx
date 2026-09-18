import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { router } from "@/routes";
import { MotionConfig } from 'framer-motion';
import { PrivacyPreferences } from '@/components/privacy/PrivacyPreferences';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <UIProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <PrivacyPreferences />
          </AuthProvider>
        </UIProvider>
      </ThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
