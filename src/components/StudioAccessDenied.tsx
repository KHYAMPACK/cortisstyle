"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

interface StudioAccessDeniedProps {
  email?: string | null;
  message?: string;
}

export function StudioAccessDenied({ email, message }: StudioAccessDeniedProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-jet-black px-6 text-center text-white">
      <BrandLogo variant="onDark" className="mb-10 h-8 w-auto" />
      <p className="font-mono text-[10px] tracking-[0.32em] text-neutral-400 uppercase">
        Studio access restricted
      </p>
      <h1 className="mt-4 max-w-md font-sans text-[22px] font-medium tracking-tight text-white">
        This workspace is invite-only
      </h1>
      <p className="mt-4 max-w-md font-sans text-[13px] leading-relaxed text-neutral-400">
        {message ??
          "Lookbook Studio is limited to curators on the Cortisstyle roster."}
        {email ? (
          <>
            {" "}
            Signed in as <span className="text-neutral-200">{email}</span>.
          </>
        ) : null}
      </p>
      <p className="mt-3 max-w-md font-sans text-[12px] leading-relaxed text-neutral-500">
        Ask an admin to add your account to <code className="text-neutral-300">studio_curators</code>{" "}
        in Supabase, or contact the archive team for access.
      </p>
      <Link
        href="/"
        className="mt-10 border border-white/20 px-6 py-3 font-mono text-[10px] tracking-[0.28em] text-white uppercase transition-opacity hover:opacity-80"
      >
        Back to cortisstyle.com
      </Link>
    </div>
  );
}
