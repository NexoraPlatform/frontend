import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center dark:bg-[#070C14]">
            <h1 className="text-9xl font-bold text-slate-200 dark:text-slate-800">404</h1>
            <div className="absolute flex flex-col items-center space-y-6">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
                    Page not found
                </h2>
                <p className="max-w-md text-slate-500 dark:text-slate-400">
                    Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
                </p>
                <Link href="/">
                    <Button className="h-11 rounded-full px-8">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
