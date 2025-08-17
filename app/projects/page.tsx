"use client";

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Search,
    Plus,
    Calendar,
    DollarSign,
    Users,
    Clock,
    Star,
    MapPin,
    Eye,
    MessageSquare,
    Target,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';

export default function ProjectsPage() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [budgetFilter, setBudgetFilter] = useState('all');

    // Mock projects data
    const projects = [
        {
            id: '1',
            title: 'Website E-commerce Modern',
            description: 'Dezvoltare platformă e-commerce cu React și Node.js pentru vânzarea de produse handmade',
            category: 'Dezvoltare Web',
            budget: 5000,
            budgetType: 'FIXED',
            status: 'ACTIVE',
            priority: 'HIGH',
            deadline: '2024-03-15',
            technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
            client: {
                name: 'Maria Popescu',
                avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=100',
                rating: 4.8,
                location: 'București'
            },
            proposalsCount: 12,
            createdAt: '2024-01-15',
            featured: true
        },
        {
            id: '2',
            title: 'Aplicație Mobile pentru Fitness',
            description: 'App nativ iOS și Android pentru tracking antrenamente și nutriție',
            category: 'Mobile Development',
            budget: 8000,
            budgetType: 'MILESTONE',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            deadline: '2024-04-20',
            technologies: ['React Native', 'Firebase', 'Redux'],
            client: {
                name: 'Alexandru Ionescu',
                avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
                rating: 4.9,
                location: 'Cluj-Napoca'
            },
            proposalsCount: 8,
            createdAt: '2024-01-20',
            featured: false
        },
        {
            id: '3',
            title: 'Redesign Identitate Vizuală',
            description: 'Logo nou, brand guidelines și materiale de marketing pentru startup tech',
            category: 'Design UI/UX',
            budget: 75,
            budgetType: 'HOURLY',
            status: 'ACTIVE',
            priority: 'LOW',
            deadline: '2024-02-28',
            technologies: ['Figma', 'Adobe Illustrator', 'Photoshop'],
            client: {
                name: 'Diana Radu',
                avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=100',
                rating: 4.7,
                location: 'Timișoara'
            },
            proposalsCount: 15,
            createdAt: '2024-01-25',
            featured: true
        }
    ];
    type Status = 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

    const getStatusBadge = (status: Status) => {
        const colors = {
            'ACTIVE': 'bg-green-100 text-green-800',
            'IN_PROGRESS': 'bg-blue-100 text-blue-800',
            'COMPLETED': 'bg-gray-100 text-gray-800',
            'CANCELLED': 'bg-red-100 text-red-800'
        };
        return colors[status] || colors['ACTIVE'];
    };
    type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

    const getPriorityBadge = (priority: Priority) => {
        const colors = {
            'LOW': 'bg-green-100 text-green-800',
            'MEDIUM': 'bg-blue-100 text-blue-800',
            'HIGH': 'bg-orange-100 text-orange-800',
            'URGENT': 'bg-red-100 text-red-800'
        };
        return colors[priority] || colors['MEDIUM'];
    };


    const getBudgetTypeLabel = (type: string) => {
        switch (type) {
            case 'FIXED': return 'Fix';
            case 'HOURLY': return 'Pe oră';
            case 'MILESTONE': return 'Milestone';
            default: return type;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Proiecte Disponibile</h1>
                        <p className="text-muted-foreground">
                            Găsește proiecte interesante și aplică cu oferta ta
                        </p>
                    </div>
                    {user?.role === 'CLIENT' && (
                        <Link href="/projects/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Adaugă Proiect
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Caută proiecte..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Categorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toate categoriile</SelectItem>
                                    <SelectItem value="web">Dezvoltare Web</SelectItem>
                                    <SelectItem value="mobile">Mobile Development</SelectItem>
                                    <SelectItem value="design">Design UI/UX</SelectItem>
                                    <SelectItem value="marketing">Marketing Digital</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Buget" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toate bugetele</SelectItem>
                                    <SelectItem value="0-1000">0 - 1,000 RON</SelectItem>
                                    <SelectItem value="1000-5000">1,000 - 5,000 RON</SelectItem>
                                    <SelectItem value="5000-10000">5,000 - 10,000 RON</SelectItem>
                                    <SelectItem value="10000+">10,000+ RON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Projects Grid */}
                <div className="space-y-6">
                    {projects.map((project) => (
                        <Card key={project.id} className={`hover:shadow-lg transition-shadow ${project.featured ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-xl font-semibold">{project.title}</h3>
                                            {project.featured && (
                                                <Badge className="bg-yellow-100 text-yellow-800">
                                                    ⭐ Recomandat
                                                </Badge>
                                            )}
                                            <Badge className={getPriorityBadge(project.priority as |Priority)}>
                                                {project.priority}
                                            </Badge>
                                            <Badge className={getStatusBadge(project.status as Status)}>
                                                {project.status}
                                            </Badge>
                                        </div>

                                        <p className="text-muted-foreground mb-4 leading-relaxed">
                                            {project.description}
                                        </p>

                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {project.technologies.map((tech) => (
                                                <Badge key={tech} variant="outline" className="text-xs">
                                                    {tech}
                                                </Badge>
                                            ))}
                                        </div>

                                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                            <div className="flex items-center space-x-1">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="font-semibold text-green-600 text-base">
                          {project.budget.toLocaleString()} RON
                        </span>
                                                <span>({getBudgetTypeLabel(project.budgetType)})</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>Deadline: {new Date(project.deadline).toLocaleDateString('ro-RO')}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Users className="w-4 h-4" />
                                                <span>{project.proposalsCount} oferte</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4" />
                                                <span>Postat {new Date(project.createdAt).toLocaleDateString('ro-RO')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={project.client.avatar} />
                                                <AvatarFallback>
                                                    {project.client.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-sm">{project.client.name}</div>
                                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    <span>{project.client.rating}</span>
                                                    <span>•</span>
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{project.client.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Button className="w-full">
                                                <Target className="w-4 h-4 mr-2" />
                                                Aplică Acum
                                            </Button>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-3 h-3 mr-1" />
                                                    Detalii
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <MessageSquare className="w-3 h-3 mr-1" />
                                                    Întreabă
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Load More */}
                <div className="text-center mt-12">
                    <Button variant="outline" size="lg">
                        Încarcă Mai Multe Proiecte
                    </Button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
