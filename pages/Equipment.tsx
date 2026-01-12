import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Wrench, 
  CheckCircle, 
  Star, 
  Phone, 
  Mail, 
  MapPin,
  ArrowRight,
  Dumbbell,
  Award,
  Shield,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';

// Import equipment images from Equipment folder
const equipmentImageModules = import.meta.glob('../Equipment/*.{png,jpg,jpeg}', { eager: true });
const equipmentImages: Record<string, string> = {};

// Map image filenames to equipment names
Object.entries(equipmentImageModules).forEach(([path, module]: [string, any]) => {
  // Extract filename without extension
  const filename = path.split('/').pop()?.replace(/\.(png|jpg|jpeg)$/i, '') || '';
  const imageUrl = typeof module === 'string' ? module : module.default || module;
  // Store with the exact filename (will match equipment names)
  equipmentImages[filename] = imageUrl;
});

interface Equipment {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  features: string[];
}

interface RepairService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const Equipment: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const equipmentCategories = ['all', 'Cardio', 'Strength', 'Free Weights', 'Accessories'];

  const equipment: Equipment[] = [
    {
      id: '1',
      name: 'Treadmill Pro 3000',
      category: 'Cardio',
      image: equipmentImages['Treadmill Pro 3000'] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
      description: 'Professional-grade treadmill with advanced features and durable construction.',
      features: ['12 km/h max speed', '15 incline levels', 'Heart rate monitor', 'LCD display']
    },
    {
      id: '2',
      name: 'Elliptical Trainer Elite',
      category: 'Cardio',
      image: equipmentImages['Elliptical Trainer Elite'] || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=80',
      description: 'Low-impact cardio machine perfect for full-body workouts.',
      features: ['20 resistance levels', 'Built-in programs', 'Pulse sensors', 'Compact design']
    },
    {
      id: '3',
      name: 'Stationary Bike Pro',
      category: 'Cardio',
      image: equipmentImages['Stationary Bike Pro'] || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop&q=80',
      description: 'Ergonomic design with smooth resistance and comfortable seating.',
      features: ['Magnetic resistance', 'Adjustable seat', 'Digital display', 'Quiet operation']
    },
    {
      id: '4',
      name: 'Smith Machine Complete',
      category: 'Strength',
      image: equipmentImages['Smith Machine Complete'] || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop&q=80',
      description: 'All-in-one strength training system with safety features.',
      features: ['Safety catches', 'Multiple stations', 'Olympic bar included', 'Weight storage']
    },
    {
      id: '5',
      name: 'Cable Crossover Machine',
      category: 'Strength',
      image: equipmentImages['Cable Crossover Machine'] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
      description: 'Versatile cable system for comprehensive strength training.',
      features: ['Dual pulleys', 'Adjustable height', 'Multiple attachments', 'Smooth operation']
    },
    {
      id: '6',
      name: 'Leg Press Machine',
      category: 'Strength',
      image: equipmentImages['Leg Press Machine'] || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=80',
      description: 'Heavy-duty leg press for powerful lower body workouts.',
      features: ['45° angle design', 'Weight capacity: 500kg', 'Comfortable backrest', 'Safety locks']
    },
    {
      id: '7',
      name: 'Olympic Barbell Set',
      category: 'Free Weights',
      image: equipmentImages['Olympic Barbell Set'] || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop&q=80',
      description: 'Professional Olympic barbell with weight plates included.',
      features: ['20kg barbell', '200kg total weight', 'Chrome finish', 'Competition grade']
    },
    {
      id: '8',
      name: 'Adjustable Dumbbells',
      category: 'Free Weights',
      image: equipmentImages['Adjustable Dumbbells'] || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop&q=80',
      description: 'Space-saving adjustable dumbbells with quick-change system.',
      features: ['5-50kg per dumbbell', 'Quick dial system', 'Compact storage', 'Durable construction']
    },
    {
      id: '9',
      name: 'Kettlebell Set',
      category: 'Free Weights',
      image: equipmentImages['Kettlebell Set'] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80',
      description: 'Complete kettlebell set for functional training.',
      features: ['4kg to 32kg range', 'Cast iron construction', 'Smooth finish', 'Set of 6']
    },
    {
      id: '10',
      name: 'Yoga Mat Premium',
      category: 'Accessories',
      image: equipmentImages['Yoga Mat Premium'] || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop&q=80',
      description: 'Extra-thick non-slip yoga mat for comfort and stability.',
      features: ['10mm thickness', 'Non-slip surface', 'Eco-friendly material', 'Carrying strap']
    },
    {
      id: '11',
      name: 'Resistance Bands Set',
      category: 'Accessories',
      image: equipmentImages['Resistance Bands Set'] || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=600&fit=crop&q=80',
      description: 'Professional resistance band set with multiple resistance levels.',
      features: ['5 resistance levels', 'Door anchor included', 'Exercise guide', 'Portable']
    },
    {
      id: '12',
      name: 'Foam Roller Pro',
      category: 'Accessories',
      image: equipmentImages['Foam Roller Pro'] || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop&q=80',
      description: 'High-density foam roller for muscle recovery and flexibility.',
      features: ['High density foam', 'Textured surface', 'Multiple sizes', 'Durable']
    }
  ];

  const repairServices: RepairService[] = [
    {
      id: '1',
      name: 'Treadmill Repair',
      description: 'Expert repair for all treadmill models including motor, belt, and electronic issues.',
      icon: <Zap className="w-8 h-8" />
    },
    {
      id: '2',
      name: 'Strength Equipment',
      description: 'Comprehensive repair services for weight machines, cables, and pulleys.',
      icon: <Dumbbell className="w-8 h-8" />
    },
    {
      id: '3',
      name: 'Cardio Machines',
      description: 'Specialized repair for elliptical trainers, bikes, and rowing machines.',
      icon: <TrendingUp className="w-8 h-8" />
    },
    {
      id: '4',
      name: 'Preventive Maintenance',
      description: 'Regular maintenance programs to keep your equipment running smoothly.',
      icon: <Shield className="w-8 h-8" />
    }
  ];

  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(eq => eq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1920&h=1080&fit=crop&q=80)` }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-rose-600/5 via-transparent to-blue-600/5"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-sm font-bold mb-6">
              <ShoppingCart className="w-4 h-4" />
              Equipment & Services
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
              Premium Gym Equipment
              <span className="block text-rose-600 mt-2">Sales & Repair Services</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Transform your fitness space with professional-grade equipment. We offer top-quality gym equipment sales and expert repair services to keep you moving.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#equipment" className="px-8 py-4 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Browse Equipment
              </a>
              <a href="tel:+233246458898" className="px-8 py-4 bg-white text-rose-600 border-2 border-rose-600 font-bold rounded-lg hover:bg-rose-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2">
                <Wrench className="w-5 h-5" />
                Repair Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Sales Section */}
      <section id="equipment" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
              Our <span className="text-rose-600">Equipment</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Premium quality gym equipment for home and commercial use
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {equipmentCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-rose-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Equipment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEquipment.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-slate-100"
              >
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-rose-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {item.category}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.name}</h3>
                  <p className="text-slate-600 mb-4 leading-relaxed">{item.description}</p>
                  <ul className="space-y-2 mb-6">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="tel:+233246458898" className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />
                    Inquire Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Repair Services Section */}
      <section id="repair" className="py-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-sm font-bold mb-6">
              <Wrench className="w-4 h-4" />
              Expert Repair Services
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
              Professional Equipment <span className="text-rose-600">Repair</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Keep your equipment in peak condition with our expert repair and maintenance services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {repairServices.map((service) => (
              <div
                key={service.id}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-slate-100 group"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mb-4 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.name}</h3>
                <p className="text-slate-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>

          {/* Why Choose Our Repair Services */}
          <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-8 sm:p-12 text-white">
            <h3 className="text-3xl font-bold mb-8 text-center">Why Choose Our Repair Services?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Award className="w-12 h-12 mx-auto mb-4 text-rose-200" />
                <h4 className="text-xl font-bold mb-2">Certified Technicians</h4>
                <p className="text-rose-100">Our team is certified and experienced in all major equipment brands</p>
              </div>
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-rose-200" />
                <h4 className="text-xl font-bold mb-2">Quick Turnaround</h4>
                <p className="text-rose-100">Fast and efficient service to minimize your downtime</p>
              </div>
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-rose-200" />
                <h4 className="text-xl font-bold mb-2">Warranty Included</h4>
                <p className="text-rose-100">All repairs come with a comprehensive warranty for your peace of mind</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Repairer Profile Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
              Meet Our <span className="text-rose-600">Expert Technician</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Experienced professional dedicated to keeping your equipment running smoothly
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="md:flex">
                {/* Technician Image */}
                <div className="md:w-2/5 bg-gradient-to-br from-rose-600 to-rose-700 p-8 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center overflow-hidden shadow-2xl">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80"
                        alt="Equipment Technician"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white/90 text-sm">5.0 Rating</p>
                  </div>
                </div>

                {/* Technician Details */}
                <div className="md:w-3/5 p-8 sm:p-12">
                  <h3 className="text-3xl font-bold text-slate-900 mb-2">Ibrahim Kabore</h3>
                  <p className="text-xl text-rose-600 font-semibold mb-6">Operation Manager / Equipment Technician</p>
                  
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    With extensive experience in gym equipment repair and maintenance, Ibrahim is our lead technician specializing in all major fitness equipment brands. His expertise spans from complex treadmill motor repairs to precision cable system adjustments.
                  </p>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <Award className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Certifications</h4>
                        <p className="text-slate-600 text-sm">Certified Fitness Equipment Technician (CFET), Advanced Electronics Repair Certification</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Experience</h4>
                        <p className="text-slate-600 text-sm">15+ years repairing commercial and residential gym equipment</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-6 h-6 text-rose-600 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Specializations</h4>
                        <p className="text-slate-600 text-sm">Treadmills, Ellipticals, Strength Equipment, Electronic Systems, Preventive Maintenance</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-bold text-slate-900 mb-4">Get in Touch</h4>
                    <div className="space-y-3">
                      <a href="tel:+233246458898" className="flex items-center gap-3 text-slate-700 hover:text-rose-600 transition-colors">
                        <Phone className="w-5 h-5 text-rose-600" />
                        <span className="font-medium">+233 24 645 8898</span>
                      </a>
                      <a href="mailto:goodlifeghana13@gmail.com" className="flex items-center gap-3 text-slate-700 hover:text-rose-600 transition-colors">
                        <Mail className="w-5 h-5 text-rose-600" />
                        <span className="font-medium">goodlifeghana13@gmail.com</span>
                      </a>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-rose-600 flex-shrink-0 mt-1" />
                        <div>
                          <p className="font-medium text-slate-900">Service Locations</p>
                          <p className="text-slate-600 text-sm">Sunyani Airport Branch & Wamfie Branch</p>
                        </div>
                      </div>
                    </div>
                    <a href="tel:+233246458898" className="mt-6 w-full sm:w-auto px-8 py-3 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2">
                      <Phone className="w-5 h-5" />
                      Schedule Repair Service
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-br from-rose-600 to-rose-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6">Ready to Upgrade Your Equipment?</h2>
          <p className="text-xl text-rose-100 mb-8 leading-relaxed">
            Contact us today for equipment inquiries or to schedule a repair service. We're here to help you achieve your fitness goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+233246458898" className="px-8 py-4 bg-white text-rose-600 font-bold rounded-lg hover:bg-slate-100 transition-all shadow-xl inline-flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              Call Us Now
            </a>
            <a href="mailto:goodlifeghana13@gmail.com" className="px-8 py-4 bg-rose-800 text-white border-2 border-white font-bold rounded-lg hover:bg-rose-900 transition-all shadow-xl inline-flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Send Email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Equipment;
