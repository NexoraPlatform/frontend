"use client";

import {
    Code,
    Palette,
    Smartphone,
    TrendingUp,
    Shield,
    Zap,
} from 'lucide-react';
import {useEffect, useState} from "react";

export default function HeroSectionClient() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const floatingElements = [
        { icon: Code, delay: 0, duration: 6 },
        { icon: Palette, delay: 1, duration: 8 },
        { icon: Smartphone, delay: 2, duration: 7 },
        { icon: TrendingUp, delay: 3, duration: 9 },
        { icon: Shield, delay: 4, duration: 6 },
        { icon: Zap, delay: 5, duration: 8 },
    ];

    return (
        <>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/30 to-purple-100/30 dark:from-transparent dark:via-blue-900/10 dark:to-purple-900/10" />

        {/* Floating geometric shapes */}
        <div className="absolute inset-0">
            {floatingElements.map((element, index) => (
                <div
                    key={index}
                    className="absolute animate-pulse opacity-10 dark:opacity-5"
                    style={{
                        left: `${20 + index * 15}%`,
                        top: `${10 + index * 12}%`,
                        animationDelay: `${element.delay}s`,
                        animationDuration: `${element.duration}s`,
                    }}
                >
                    <element.icon className="w-16 h-16 text-blue-600" />
                </div>
            ))}
        </div>

        {/* Interactive cursor effect */}
        <div
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl transition-all duration-1000 ease-out pointer-events-none"
            style={{
                left: mousePosition.x - 192,
                top: mousePosition.y - 192,
            }}
        />
        </>
    );
}
