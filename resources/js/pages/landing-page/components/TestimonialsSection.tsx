import React from 'react';
import { Star, Quote } from 'lucide-react';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar?: string;
  rating: number;
}

interface TestimonialsSectionProps {
  brandColor?: string;
  testimonials: Testimonial[];
  settings?: any;
  sectionData?: {
    title?: string;
    subtitle?: string;
    trust_title?: string;
    trust_stats?: Array<{
      value: string;
      label: string;
      color: string;
    }>;
    default_testimonials?: Array<{
      name: string;
      role: string;
      company?: string;
      content: string;
      rating: number;
    }>;
  };
}

export default function TestimonialsSection({ testimonials, settings, sectionData, brandColor = '#3b82f6' }: TestimonialsSectionProps) {
  const { ref, isVisible } = useScrollAnimation();
  // Fallback testimonials if none provided
  const defaultTestimonials = sectionData?.testimonials?.map((testimonial, index) => ({
    id: index + 1,
    ...testimonial
  })) || [
      {
        name: 'Alice Johnson',
        role: 'HR Manager',
        company: 'GlobalTech Ltd.',
        content: 'HRMGo has made managing employee records and attendance effortless. Our HR team saves hours every week!',
        rating: 5
      },
      {
        name: 'Robert Smith',
        role: 'Operations Head',
        company: 'Innovate Solutions',
        content: 'The payroll automation is incredibly accurate and easy to use. No more manual calculations or errors!',
        rating: 5
      },
      {
        name: 'Maria Davis',
        role: 'CEO',
        company: 'BrightFuture Corp.',
        content: 'From recruitment to performance management, HRMGo covers everything we need in one platform.',
        rating: 5
      },
      {
        name: 'David Lee',
        role: 'Talent Acquisition Lead',
        company: 'NextGen Enterprises',
        content: 'Recruitment and onboarding have never been smoother. HRMGo’s platform is intuitive and efficient.',
        rating: 5
      },
      {
        name: 'Samantha Green',
        role: 'Payroll Specialist',
        company: 'BrightSolutions Inc.',
        content: 'Payroll processing is now quick and error-free thanks to HRMGo. It has transformed our monthly workflow.',
        rating: 5
      },
      {
        name: 'Michael Brown',
        role: 'HR Coordinator',
        company: 'TechWave Ltd.',
        content: 'The performance management module helps us track employee goals and progress effortlessly.',
        rating: 5
      },
    ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials;

    const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? 'fill-current text-current' : 'text-gray-300'}`}
        style={index < rating ? { color: brandColor } : {}}
        fill={index < rating ? brandColor : 'none'}
      />
    ));
  };
  
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-8 sm:mb-12 lg:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {sectionData?.title || 'What Our Clients Say'}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            {sectionData?.subtitle || "Hear from HR leaders who trust our platform."}
          </p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {displayTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors relative"
            >
              {/* Quote Icon */}
              <div className="absolute -top-3 left-6">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                  <Quote className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4 pt-2">
                {renderStars(testimonial.rating)}
              </div>

              {/* Testimonial Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: brandColor }}>
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}
                    {testimonial.company && (
                      <span className="text-gray-400"> • {testimonial.company}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        {(sectionData?.trust_stats && sectionData.trust_stats.length > 0) && (
          <div className="mt-8 sm:mt-12 lg:mt-16 text-center">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {sectionData?.trust_title || 'Trusted by HR Professionals Worldwide'}
              </h3>
              <div className="flex justify-center items-center gap-8 flex-wrap">
                {sectionData.trust_stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}