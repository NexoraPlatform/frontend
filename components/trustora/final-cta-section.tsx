export function TrustoraFinalCtaSection() {
    return (
        <section className="py-32 px-6 bg-[#0B1C2D] text-white text-center dark:bg-[#0B1220]">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl lg:text-5xl font-bold mb-8">No trust. No deal.</h2>
                <p className="text-slate-400 mb-12 text-lg dark:text-[#A3ADC2]">Work without risk on the safest platform for online services.</p>
                <button className="px-10 py-5 btn-primary font-bold rounded-lg text-xl">Start a protected project</button>
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-40 grayscale dark:border-[#1E2A3D]">
                    <span className="font-bold mono uppercase tracking-widest text-sm">Escrow Secured</span>
                    <span className="font-bold mono uppercase tracking-widest text-sm">Video Verified</span>
                    <span className="font-bold mono uppercase tracking-widest text-sm">Legal Grade</span>
                </div>
            </div>
        </section>
    );
}
