import { getCortisstyleApiUrl } from './cortisstyleOrigin'

/** Built into www.cortisstyle.com/studio — same origin as Next.js APIs */
export function isStudioIntegrated(): boolean {
  return import.meta.env.VITE_STUDIO_INTEGRATED === 'true'
}

export function getStudioApiOrigin(): string {
  return isStudioIntegrated() ? '' : getCortisstyleApiUrl()
}
