import dynamic from "next/dynamic";

const TrustFlowNetwork = dynamic(() => import("./TrustFlowNetwork"), { ssr: false });

export default function Hero() {
    return (
        <section className="relative overflow-hidden bg-[#0B1C2D]">
            {/* 3D background (client-only) */}
            <div className="pointer-events-none absolute inset-0">
                <TrustFlowNetwork className="h-[620px] w-full md:h-[720px]" />
                {/* Readability gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0B1C2D]/40 via-[#0B1C2D]/55 to-[#0B1C2D]/90" />
            </div>

            {/* Content */}
            <div className="relative mx-auto flex h-[620px] max-w-6xl flex-col items-center justify-center px-6 text-center md:h-[720px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                    <span className="h-2 w-2 rounded-full bg-[#1BC47D]" />
                    Digital trust infrastructure
                </div>

                <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
                    Hire and get paid with zero risk
                </h1>

                <p className="mt-4 max-w-2xl text-pretty text-base text-white/75 md:text-lg">
                    Verified professionals. Protected payments. Enforced delivery.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <a
                        href="#start"
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1BC47D] px-6 text-sm font-semibold text-[#071A12] shadow-[0_0_22px_rgba(27,196,125,0.25)] transition hover:bg-[#21D19F] focus:outline-none focus:ring-2 focus:ring-[#1BC47D]/60"
                    >
                        Start a protected project
                    </a>

                    <a
                        href="#how"
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                        How it works
                    </a>
                </div>

                {/* subtle trust chips */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs text-white/65">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Escrow</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">KYC Verification</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Milestones</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Dispute Resolution</span>
                </div>
            </div>
        </section>
    );
}
