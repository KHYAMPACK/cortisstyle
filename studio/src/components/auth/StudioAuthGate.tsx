import { useStudioAuth, getStudioAccessDeniedHomeUrl } from '../../hooks/useStudioAuth'
import { getStudioLoginUrl } from '../../lib/authRedirect'
import { useDraftAutosave } from '../../hooks/useDraftAutosave'
import { CollageWorkspaceView } from '../../views/CollageWorkspaceView'
import {
  STUDIO_BTN_GHOST,
  STUDIO_BTN_PRIMARY,
  STUDIO_CHROME_BG,
  STUDIO_KICKER,
  STUDIO_LABEL,
  STUDIO_SECTION_TITLE,
} from '../../lib/studioUiTokens'

function StudioLoadingScreen({ message }: { message?: string }) {
  return (
    <div
      className={`flex h-screen w-screen flex-col items-center justify-center gap-3 ${STUDIO_CHROME_BG} text-zinc-200`}
    >
      <p className={STUDIO_LABEL}>Validating studio access…</p>
      {message ? (
        <p className="max-w-sm px-6 text-center font-sans text-[12px] text-zinc-500">{message}</p>
      ) : null}
    </div>
  )
}

function StudioAccessDeniedScreen({
  email,
  message,
}: {
  email: string | null
  message: string | null
}) {
  return (
    <div className="hero-editorial-gradient flex h-screen w-screen flex-col items-center justify-center gap-4 px-6 text-center text-white">
      <p className={STUDIO_KICKER}>Studio Access</p>
      <h1 className={`${STUDIO_SECTION_TITLE} text-white`}>Invite-only workspace</h1>
      <p className="max-w-md font-sans text-[13px] leading-relaxed text-neutral-300">
        {message ?? 'Lookbook Studio is limited to curators on the Cortisstyle roster.'}
        {email ? (
          <>
            {' '}
            Signed in as <span className="text-white">{email}</span>.
          </>
        ) : null}
      </p>
      <a href={getStudioAccessDeniedHomeUrl()} className={`mt-4 ${STUDIO_BTN_PRIMARY} inline-block w-auto`}>
        Back to cortisstyle.com
      </a>
    </div>
  )
}

export function StudioAuthGate() {
  const auth = useStudioAuth()
  const draft = useDraftAutosave(auth.status === 'authenticated')

  if (auth.status === 'initializing') {
    return <StudioLoadingScreen />
  }

  if (auth.status === 'unauthenticated') {
    return (
      <div className="hero-editorial-gradient flex h-screen w-screen flex-col items-center justify-center gap-4 px-6 text-center text-white">
        <p className={STUDIO_KICKER}>Lookbook Studio</p>
        <h1 className={`${STUDIO_SECTION_TITLE} text-white`}>Sign in to continue</h1>
        <p className="max-w-md font-sans text-[13px] leading-relaxed text-neutral-300">
          {auth.accessMessage ??
            'If you are not redirected automatically, use the button below.'}
        </p>
        <a href={getStudioLoginUrl()} className={`mt-2 ${STUDIO_BTN_PRIMARY} inline-block w-auto`}>
          Continue to sign in
        </a>
      </div>
    )
  }

  if (auth.status === 'forbidden') {
    return (
      <StudioAccessDeniedScreen email={auth.email} message={auth.accessMessage} />
    )
  }

  if (auth.status !== 'authenticated') {
    return <StudioLoadingScreen message={auth.accessMessage ?? undefined} />
  }

  if (draft.loadState === 'loading' || draft.loadState === 'idle') {
    return <StudioLoadingScreen />
  }

  if (draft.loadState === 'error') {
    return (
      <div className={`flex h-screen w-screen flex-col items-center justify-center gap-3 ${STUDIO_CHROME_BG} px-6 text-center text-zinc-200`}>
        <p className={STUDIO_SECTION_TITLE}>Unable to load draft</p>
        <p className="font-sans text-[12px] text-zinc-500">{draft.loadError}</p>
        <button type="button" onClick={() => window.location.reload()} className={STUDIO_BTN_GHOST}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <CollageWorkspaceView
      userEmail={auth.email}
      onSignOut={() => {
        void auth.signOut()
      }}
      draftId={draft.draftId}
      saveState={draft.saveState}
      saveError={draft.saveError}
    />
  )
}
