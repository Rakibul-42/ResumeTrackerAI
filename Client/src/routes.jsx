import { Landing, Login, Register, Dashboard, Resumes, ResumeDetail, Export, Insights, Versions, History, Settings, Legal, NotFound } from '@/pages/lazy';
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedShell } from '@/components/layout/ProtectedShell';
import { RouteFrame, RouteLoading } from '@/components/layout/RouteFrame';



export const router = createBrowserRouter([{
  element: <RouteFrame />,
  hydrateFallbackElement: <RouteLoading />,
  children: [
    { path: '/', element: <Landing /> },
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    ...['privacy', 'terms', 'cookies'].map(slug => ({ path: `/${slug}`, element: <Legal slug={slug} /> })),
    { element: <ProtectedShell />, children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/resumes', element: <Resumes /> },
      { path: '/resumes/:id', element: <ResumeDetail /> },
      { path: '/resumes/:id/export', element: <Export /> },
      { path: '/insights', element: <Insights /> },
      { path: '/versions', element: <Versions /> },
      { path: '/history', element: <History /> },
      { path: '/settings', element: <Settings /> },
    ]},
    { path: '*', element: <NotFound /> },
  ],
}]);
