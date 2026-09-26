import "./index.css"
import { StrictMode } from 'react'
import { routerTree } from './routes/_root';
import { createRoot } from 'react-dom/client'
import TanstackProvider from './contexts/TanstackProvider';
import { Toaster } from "sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";

const router = createRouter({ routeTree: routerTree });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TanstackProvider>
      <RouterProvider router={router} />
      <Toaster richColors closeButton position="top-center" theme="system" />

    </TanstackProvider>
  </StrictMode>,
)
