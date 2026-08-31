import { Navigate } from "react-router-dom";
import { useStateContext } from "../contexts/stateContext";
import { hasPermission } from "../utils/permissions";

export default function RequirePermission({ permission, children }) {
  const { user } = useStateContext();

  if (!user) {
    return null;
  }

  if (!hasPermission(user, permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
