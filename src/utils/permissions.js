export const REQUEST_LOCATION_PERMISSION = "request-location-list";

export function hasPermission(userContext, permission) {
  if (!permission) return true;
  const permissions = userContext?.permissions;
  if (!Array.isArray(permissions)) return false;
  return permissions.includes(permission);
}

export function canViewRequestLocation(userContext) {
  return hasPermission(userContext, REQUEST_LOCATION_PERMISSION);
}

export function canManageLocationTypes(userContext) {
  return userContext?.roles?.includes("Operation Analystis") ?? false;
}
