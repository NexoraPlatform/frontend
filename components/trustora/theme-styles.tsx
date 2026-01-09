export function TrustoraThemeStyles() {
    return (
        <style
            dangerouslySetInnerHTML={{
                __html: `
                    :root {
                        --midnight-blue: #0B1C2D;
                        --emerald-green: #1BC47D;
                        --success-green: #21D19F;
                        --warning-amber: #F5A623;
                        --error-red: #E5484D;
                        --bg-light: #F5F7FA;
                        --text-near-black: #0F172A;
                    }
                    body {
                        font-family: 'Inter', sans-serif;
                        background-color: white;
                        color: var(--text-near-black);
                        scroll-behavior: smooth;
                    }
                    .dark body {
                        background-color: #070C14;
                        color: #E6EDF3;
                    }
                    .mono {
                        font-family: 'JetBrains Mono', monospace;
                    }
                    .btn-primary {
                        background-color: var(--emerald-green);
                        color: white;
                        transition: all 0.2s ease;
                    }
                    .btn-primary:hover {
                        filter: brightness(1.05);
                        box-shadow: 0 0 0 4px rgba(27, 196, 125, 0.15);
                    }
                    .dark .btn-primary {
                        color: #071A12;
                        box-shadow: 0 0 12px rgba(27, 196, 125, 0.35);
                    }
                    .glass-card {
                        background: white;
                        border: 1px solid rgba(11, 28, 45, 0.08);
                        border-radius: 12px;
                    }
                    .hero-gradient {
                        background: radial-gradient(circle at top right, rgba(27, 196, 125, 0.05), transparent 40%),
                            radial-gradient(circle at bottom left, rgba(11, 28, 45, 0.03), transparent 40%);
                    }
                    .dark .glass-card {
                        background: #0B1220;
                        border: 1px solid #1E2A3D;
                        box-shadow: 0 0 0 1px rgba(27, 196, 125, 0.04);
                    }
                    .section-divider {
                        border-bottom: 1px solid rgba(11, 28, 45, 0.05);
                    }
                    .dark .section-divider {
                        border-bottom: 1px solid #1E2A3D;
                    }
                    .pillar-icon {
                        stroke-width: 1.5px;
                        color: var(--emerald-green);
                    }
                `,
            }}
        />
    );
}
