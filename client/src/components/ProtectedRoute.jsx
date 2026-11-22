import { Navigate } from "react-router-dom";
import { getSession } from "../utils/api";

export default function ProtectedRoute({ role, children }) {
  const session = getSession();
  if (!session?.token || !session?.user) return <Navigate to="/login" replace />;
  if (role && session.user.role !== role) return <Navigate to={session.user.role === "MENTOR" ? "/mentor" : "/dashboard"} replace />;
  return children;
}
