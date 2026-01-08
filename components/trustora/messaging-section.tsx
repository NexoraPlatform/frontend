export function TrustoraMessagingSection() {
    return (
        <section className="py-24 px-6 bg-white" id="how">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden shadow-xl">
                    <div className="bg-white p-12 lg:p-20">
                        <span className="text-[10px] font-bold text-[#0B1C2D] bg-slate-100 px-2 py-1 rounded mb-6 inline-block">
                            FOR CLIENTS
                        </span>
                        <h2 className="text-4xl font-bold text-[#0B1C2D] mb-6">„Plătesc doar când primesc livrarea.”</h2>
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            Banii tăi sunt protejați prin escrow. Nicio plată nu părăsește platforma fără confirmarea ta explicită a calității
                            muncii.
                        </p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="text-[#1BC47D]">✅</span> Zero risc de pierdere financiară
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="text-[#1BC47D]">✅</span> Profesioniști pre-verificați video
                            </li>
                        </ul>
                        <a href="#" className="font-bold text-[#0B1C2D] border-b-2 border-[#1BC47D] pb-1">
                            Start hiring safely →
                        </a>
                    </div>
                    <div className="bg-[#0B1C2D] p-12 lg:p-20 text-white">
                        <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 rounded mb-6 inline-block">
                            FOR PROFESSIONALS
                        </span>
                        <h2 className="text-4xl font-bold mb-6">„Banii sunt blocați înainte să încep.”</h2>
                        <p className="text-slate-300 mb-8 leading-relaxed">
                            Nu mai lucrezi pe promisiuni. Plata pentru fiecare milestone este deja blocată în sistem înainte ca tu să scrii prima
                            linie de cod.
                        </p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="text-[#1BC47D]">✅</span> Garanția plății 100%
                            </li>
                            <li className="flex items-center gap-3 text-sm font-medium">
                                <span className="text-[#1BC47D]">✅</span> Dispute rezolvate prin arbitraj tehnic
                            </li>
                        </ul>
                        <a href="#" className="font-bold text-white border-b-2 border-[#1BC47D] pb-1">
                            Join the infrastructure →
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
