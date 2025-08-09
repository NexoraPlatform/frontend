"use client";

import {useState, useEffect} from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Heart,
  Share2,
  Code,
  Smartphone,
  Palette,
  TrendingUp,
  Database,
  Shield,
  Megaphone,
  Camera,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import apiClient from "@/lib/api";

interface ServiceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ServiceProviderPivot {
  service_id: number;
  user_id: number;
  created_at: string | null;
  updated_at: string | null;
}

interface ServiceProvider {
  id: number;
  email: string;
  email_verified_at: string | null;
  firstName: string;
  lastName: string;
  avatar: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  role: string;
  rating: string;
  reviewCount: number;
  callVerified: boolean;
  status: string;
  last_login_at: string | null;
  last_active_at: string | null;
  timezone: string | null;
  language: string;
  created_at: string;
  updated_at: string;
  testVerified: boolean;
  profile_url: string | null;
  stripe_account_id: string | null;
  is_online: boolean;
  last_seen: string | null;
  oldest_work_experience: string | null;
  next_available_job: string | null;
  pivot: ServiceProviderPivot;
}

interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  isActive: boolean;
  category_id: number;
  status: string;
  isFeatured: boolean;
  orderCount: number;
  rating: string;
  reviewCount: number;
  viewCount: number;
  favoriteCount: number;
  price: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category: ServiceCategory;
  providers: ServiceProvider[];
}

interface ServicesResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [pricingTypeFilter, setPricingTypeFilter] = useState('all');
  const [servicesData, setServicesData] = useState<ServicesResponse | null>(null);
  const [categoriesData, setCategoriesData] = useState<any[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const response = await apiClient.getServices({
        search: searchTerm || undefined,
        categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        sortBy,
        page: 1,
        limit: 12
      });

      setServicesData(response);
    };

    fetchServices();
  }, [priceRange, searchTerm, selectedCategory, selectedSkills, sortBy]);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await apiClient.getCategories();
      setCategoriesData(response);
    };

    fetchCategories();
  }, []);

  const categories = categoriesData || [];
  const services = servicesData?.services || [];

  const categoryIcons: { [key: string]: any } = {
    'web-development': Code,
    'mobile-development': Smartphone,
    'design': Palette,
    'marketing': TrendingUp,
    'database': Database,
    'security': Shield,
    'content': Megaphone,
    'photography': Camera
  };

  const skills = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'PHP', 'Laravel',
    'WordPress', 'Shopify', 'Figma', 'Adobe XD', 'Photoshop', 'SEO',
    'Google Ads', 'Facebook Ads', 'Content Writing', 'Video Editing'
  ];

  const pricingTypes = [
    { value: 'all', label: 'Toate tipurile' },
    { value: 'FIXED', label: 'Preț Fix' },
    { value: 'HOURLY', label: 'Pe Oră' },
    { value: 'DAILY', label: 'Pe Zi' },
    { value: 'WEEKLY', label: 'Pe Săptămână' },
    { value: 'MONTHLY', label: 'Pe Lună' },
    { value: 'CUSTOM', label: 'Negociabil' }
  ];

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getPricingDisplay = (provider: any) => {
    switch (provider.pricingType) {
      case 'HOURLY':
        return `${provider.hourlyRate || provider.basePrice} RON/oră`;
      case 'DAILY':
        return `${provider.dailyRate || provider.basePrice} RON/zi`;
      case 'WEEKLY':
        return `${provider.weeklyRate || provider.basePrice} RON/săptămână`;
      case 'MONTHLY':
        return `${provider.monthlyRate || provider.basePrice} RON/lună`;
      case 'CUSTOM':
        return provider.negotiable ? 'Preț negociabil' : `de la ${provider.basePrice} RON`;
      default:
        return `${provider.basePrice} RON`;
    }
  };

  type PricingType = 'FIXED' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

  const getPricingTypeBadge = (pricingType: string) => {
    const types: Record<PricingType, { label: string; color: string }> = {
      FIXED: { label: 'Fix', color: 'bg-blue-100 text-blue-800' },
      HOURLY: { label: 'Pe Oră', color: 'bg-green-100 text-green-800' },
      DAILY: { label: 'Pe Zi', color: 'bg-purple-100 text-purple-800' },
      WEEKLY: { label: 'Pe Săptămână', color: 'bg-orange-100 text-orange-800' },
      MONTHLY: { label: 'Pe Lună', color: 'bg-red-100 text-red-800' },
      CUSTOM: { label: 'Negociabil', color: 'bg-gray-100 text-gray-800' },
    };

    // Asigură-te că pricingType e de tip PricingType (type guard)
    if (!Object.keys(types).includes(pricingType)) {
      pricingType = 'FIXED'; // fallback
    }

    const type = types[pricingType as PricingType];
    return <Badge className={type.color}>{type.label}</Badge>;
  };

  const getLowestPrice = (providers: any[]) => {
    if (!providers || providers.length === 0) return 0;
    return Math.min(...providers.map(p => p.basePrice));
  };

  const getHighestRating = (providers: any[]) => {
    if (!providers || providers.length === 0) return 0;
    return Math.max(...providers.map(p => p.rating || 0));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Servicii IT cu Tarife Personalizate
          </h1>
          <p className="text-xl text-muted-foreground">
            Descoperă peste 500 de experți verificați cu tarife personalizate pentru fiecare serviciu
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Caută servicii, tehnologii sau experți..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 py-6 text-lg"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-64 py-6">
                <SelectValue placeholder="Selectează categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span>Toate Categoriile</span>
                  </div>
                </SelectItem>
                {categories.map((category: any) => {
                  const IconComponent = categoryIcons[category.slug] || Filter;
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filtrează Rezultatele</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing Type Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Tip Tarif</h3>
                  <Select value={pricingTypeFilter} onValueChange={setPricingTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-semibold mb-3">Buget (RON)</h3>
                  <div className="space-y-3">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={5000}
                      min={0}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{priceRange[0]} RON</span>
                      <span>{priceRange[1]} RON</span>
                    </div>
                  </div>
                </div>

                {/* Skills Filter */}
                <div>
                  <h3 className="font-semibold mb-3">Tehnologii & Skills</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {skills.map(skill => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={() => handleSkillToggle(skill)}
                        />
                        <label htmlFor={skill} className="text-sm cursor-pointer">
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategory('all');
                    setPriceRange([0, 5000]);
                    setSelectedSkills([]);
                    setSearchTerm('');
                    setPricingTypeFilter('all');
                  }}
                >
                  Resetează Filtrele
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Services Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {`${services?.length} servicii găsite`}
              </p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Recomandate</SelectItem>
                  <SelectItem value="price_low">Preț: Mic → Mare</SelectItem>
                  <SelectItem value="price_high">Preț: Mare → Mic</SelectItem>
                  <SelectItem value="rating">Rating Cel Mai Mare</SelectItem>
                  <SelectItem value="newest">Cele Mai Noi</SelectItem>
                </SelectContent>
              </Select>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {services.map((service: any) => (
                  <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          {service.isFeatured && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                              ⭐ Recomandat
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            {service.category?.name}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {service.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {/* Providers Preview */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            {service.providers?.length || 0} prestatori disponibili
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {getHighestRating(service.providers)}
                            </span>
                          </div>
                        </div>

                        {/* Top 3 providers preview */}
                        <div className="space-y-2">
                          {(service.providers || []).slice(0, 3).map((provider: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={provider.provider?.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {provider.provider?.firstName?.[0]}{provider.provider?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium">
                                  {provider.provider?.firstName} {provider.provider?.lastName}
                                </span>
                                {getPricingTypeBadge(provider.pricingType)}
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-green-600">
                                  {getPricingDisplay(provider)}
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs">{provider.rating || 0}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {service.providers?.length > 3 && (
                          <div className="text-center mt-2">
                            <span className="text-xs text-muted-foreground">
                              +{service.providers.length - 3} prestatori în plus
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(service.skills || []).slice(0, 3).map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(service.skills || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(service.skills || []).length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Service Details */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{service.orderCount || 0} comenzi</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Livrare flexibilă</span>
                        </div>
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-bold text-primary">
                            de la {getLowestPrice(service.providers)} RON
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {service.providers?.length || 0} prestatori
                          </div>
                        </div>
                        <Button className="px-6">
                          Vezi Oferte
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>


            {/* Load More */}
            {services.length > 0 && (
              <div className="text-center mt-12">
                <Button variant="outline" size="lg" className="px-8">
                  Încarcă Mai Multe Servicii
                </Button>
              </div>
            )}

            {/* No Results */}
            {services.length === 0 && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nu am găsit servicii</h3>
                <p className="text-muted-foreground">
                  Încearcă să modifici filtrele sau termenii de căutare
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
