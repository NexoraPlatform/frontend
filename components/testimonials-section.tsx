"use client";

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import Image from "next/image";
import '../styles/utilities.css';

export function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Maria Popescu',
      role: 'CEO, TechStart Romania',
      content:
        'Nexora ne-a ajutat să găsim echipa perfectă pentru dezvoltarea aplicației noastre fintech. Profesionalismul și calitatea au depășit toate așteptările noastre!',
      rating: 5,
      avatar:
        'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150',
      project: 'Aplicație FinTech',
      value: '45,000 RON',
      company: 'TechStart Romania',
    },
    {
      name: 'Alexandru Ionescu',
      role: 'Marketing Director, E-Commerce Plus',
      content:
        'Campania de marketing digital realizată prin Nexora ne-a dublat vânzările în doar 3 luni. ROI-ul a fost cu adevărat excepțional!',
      rating: 5,
      avatar:
        'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
      project: 'Campanie Marketing',
      value: '12,000 RON',
      company: 'E-Commerce Plus',
    },
    {
      name: 'Diana Radu',
      role: 'Fondator, Creative Studio',
      content:
        'Designul site-ului nostru a fost realizat impecabil. Echipa a înțeles perfect viziunea noastră și a livrat peste toate așteptările.',
      rating: 5,
      avatar:
        'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150',
      project: 'Website Design',
      value: '8,500 RON',
      company: 'Creative Studio',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950/50 dark:via-blue-950/10 dark:to-purple-950/10 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 border border-yellow-200 dark:border-yellow-800">
            <Star className="w-5 h-5 mr-2" />
            Testimoniale
          </Badge>
          <h2 className="text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Ce spun clienții noștri
          </h2>
          <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Mii de antreprenori și companii și-au realizat visurile cu ajutorul experților de pe Nexora
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="border-3 border-blue-200 dark:border-blue-800 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"></div>
            <CardContent className="p-16 relative z-10">
              <div className="flex mb-8">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-3xl font-medium mb-12 leading-relaxed italic text-gray-700 dark:text-gray-300">
                &ldquo;{testimonials[currentTestimonial].content}&rdquo;
              </blockquote>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">

                  <Image
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].name} width={80} height={80}
                    className="w-20 h-20 rounded-full object-cover border-4 border-blue-200 dark:border-blue-800"
                  />
                  <div>
                    <div className="font-bold text-2xl">{testimonials[currentTestimonial].name}</div>
                    <div className="text-muted-foreground text-lg">{testimonials[currentTestimonial].role}</div>
                    <div className="text-blue-600 font-semibold">{testimonials[currentTestimonial].company}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Proiect</div>
                  <div className="font-bold text-xl">{testimonials[currentTestimonial].project}</div>
                  <div className="text-lg text-green-600 font-bold">{testimonials[currentTestimonial].value}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-3 mt-12">
            {testimonials.map((_, index) => (
              <button
                  aria-label={`Mergi la pagin ${index}`}
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentTestimonial
                    ? 'bg-blue-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

