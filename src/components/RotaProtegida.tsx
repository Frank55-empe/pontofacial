import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export function RotaProtegida({ children }: { children: ReactNode }) {
  const { logado } = useAdminAuth();
  if (!logado) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
