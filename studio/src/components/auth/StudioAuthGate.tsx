import { useStudioAuth, getStudioAccessDeniedHomeUrl } from '../../hooks/useStudioAuth'
import { getStudioLoginUrl } from '../../lib/authRedirect'
import { useDraftAutosave } from '../../hooks/useDraftAutosave'
import { CollageWorkspaceView } from '../../views/CollageWorkspaceView'

function StudioLoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 bg-[#0D0D0D] text-zinc-400">
      <p className="font-sans text-[12px] tracking-[0.12em] uppercase">
        Validating studio access…
      </p>
      {message ? (
        <p className="max-w-sm px-6 text-center font-sans text-[11px] text-zinc-600">
          {message}
        </p>
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
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#0D0D0D] px-6 text-center text-zinc-300">
      <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        Studio access restricted
      </p>
      <h1 className="font-sans text-[20px] font-medium text-zinc-100">
        Invite-only workspace
      </h1>
      <p className="max-w-md font-sans text-[13px] leading-relaxed text-zinc-500">
        {message ??
          'Lookbook Studio is limited to curators on the Cortisstyle roster.'}
        {email ? (
          <>
            {' '}
            Signed in as <span className="text-zinc-300">{email}</span>.
          </>
        ) : null}
      </p>
      <a
        href={getStudioAccessDeniedHomeUrl()}
        className="mt-4 border border-white/15 px-5 py-2.5 font-sans text-[11px] uppercase tracking-[0.12em] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
      >
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
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#0D0D0D] px-6 text-center text-zinc-300">
        <p className="font-sans text-[13px]">Redirecting to cortisstyle login…</p>
        <p className="max-w-md font-sans text-[11px] leading-relaxed text-zinc-500">
          {auth.accessMessage ??
            'If you are not redirected automatically, use the button below.'}
        </p>
        <a
          href={getStudioLoginUrl()}
          className="mt-2 border border-white/15 px-5 py-2.5 font-sans text-[11px] uppercase tracking-[0.12em] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
        >
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
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-[#0D0D0D] px-6 text-center text-zinc-300">
        <p className="font-sans text-[13px]">Unable to load draft.</p>
        <p className="font-sans text-[11px] text-zinc-500">{draft.loadError}</p>
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
