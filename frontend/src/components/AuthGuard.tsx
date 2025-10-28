import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthGuard({ children }: { children: JSX.Element }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AuthGuard;
