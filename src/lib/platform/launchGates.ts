/** Maintenance gate helpers for edge + app shell. */

export const MAINTENANCE_PATH = "/maintenance";

/** When true, all routes redirect to the maintenance gate except allowlisted paths. */
export function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
}

export function isMaintenancePath(pathname: string): boolean {
  return pathname === MAINTENANCE_PATH;
}
