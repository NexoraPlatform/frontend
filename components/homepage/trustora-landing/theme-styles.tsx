"use client";

export function TrustoraLandingThemeStyles() {
  return (
    <style>{`
      .project-homepage {
        --background: 0 0% 96%;
        --foreground: 222 47% 11%;
        --card: 0 0% 100%;
        --card-foreground: 222 47% 11%;
        --popover: 0 0% 100%;
        --popover-foreground: 222 47% 11%;
        --primary: 158 64% 42%;
        --primary-foreground: 0 0% 100%;
        --secondary: 210 40% 96.1%;
        --secondary-foreground: 222 47% 11%;
        --muted: 210 40% 96.1%;
        --muted-foreground: 215 16% 47%;
        --accent: 158 64% 42%;
        --accent-foreground: 0 0% 100%;
        --destructive: 0 84.2% 60.2%;
        --destructive-foreground: 0 0% 98%;
        --border: 214 32% 91%;
        --input: 214 32% 91%;
        --ring: 158 64% 42%;
        --radius: 1rem;
      }

      .dark .project-homepage {
        --background: 210 50% 10%;
        --foreground: 210 40% 98%;
        --card: 210 45% 11%;
        --card-foreground: 210 40% 98%;
        --popover: 210 45% 11%;
        --popover-foreground: 210 40% 98%;
        --primary: 158 64% 42%;
        --primary-foreground: 0 0% 100%;
        --secondary: 210 45% 15%;
        --secondary-foreground: 210 40% 98%;
        --muted: 210 45% 15%;
        --muted-foreground: 217 10% 65%;
        --accent: 158 64% 42%;
        --accent-foreground: 0 0% 100%;
        --destructive: 0 62.8% 30.6%;
        --destructive-foreground: 210 40% 98%;
        --border: 210 40% 20%;
        --input: 210 40% 20%;
        --ring: 158 64% 42%;
      }

      .project-homepage .glass-effect {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
      }

      .project-homepage .text-gradient {
        background-image: linear-gradient(to right, hsl(var(--primary)), rgb(52 211 153));
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }
    `}</style>
  );
}
