"use client";

import {useAuth} from "@/contexts/auth-context";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {Clock, Loader2} from "lucide-react";
import {Header} from "@/components/header";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import SchoolIcon from '@mui/icons-material/School';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Se încarcă...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }


    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
                    <div className="grid grid-cols-1 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Avatar className="h-11 w-11">
                                        <AvatarImage src={user.avatar} alt={user.firstName} />
                                        <AvatarFallback>
                                            {user.firstName[0]}{user.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col space-y-[0px]">
                                        <span>{user.firstName} {user.lastName}</span>
                                        <div className="flex items-center space-x-1">
                                            <FmdGoodIcon className="text-gray-400" style={{fontSize: "14px"}} />
                                            <span className="text-gray-400 text-sm">{user.location}</span>
                                        </div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {user.bio}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <FolderSpecialIcon className="w-5 h-5" />
                                    <span>Project History</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                dada
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>Work History</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                dada
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <SchoolIcon className="w-5 h-5" />
                                    <span>Education</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                dada
                            </CardContent>
                        </Card>
                    </div>

                    <div className="gap-6">
                        <div className="mb-5">
                            Profile Link
                        </div>

                        <div className="mb-5">
                            Avability
                        </div>

                        <div>
                            Languages
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
