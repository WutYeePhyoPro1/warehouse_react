import { Navigate } from "react-router-dom";
import { useStateContext } from "../contexts/stateContext";

export default function RequireRole({ role, children }) {
  const { user } = useStateContext();

  if (!user) {
    return null;
  }

  if (!user.roles?.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
