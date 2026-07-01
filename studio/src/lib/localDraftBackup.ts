const BACKUP_PREFIX = 'cortis-studio-draft-backup:'

export function saveLocalDraftBackup(draftId: string, payload: unknown): void {
  try {
    localStorage.setItem(`${BACKUP_PREFIX}${draftId}`, JSON.stringify(payload))
  } catch {
    // ignore quota errors
  }
}

export function loadLocalDraftBackup(draftId: string): unknown | null {
  try {
    const raw = localStorage.getItem(`${BACKUP_PREFIX}${draftId}`)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function clearLocalDraftBackup(draftId: string): void {
  try {
    localStorage.removeItem(`${BACKUP_PREFIX}${draftId}`)
  } catch {
    // ignore
  }
}
