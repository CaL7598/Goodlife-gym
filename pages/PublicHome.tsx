
import React from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Zap, 
  Users, 
  Dumbbell, 
  Heart, 
  Award,
  Mail,
  Share2,
  TrendingUp,
  Target,
  Activity,
  Sparkles,
  Star,
  Quote
} from 'lucide-react';

// Import videos from the video folder
import video1 from '../video/13749263_3840_2160_24fps.mp4';
import video2 from '../video/4746006-uhd_3840_2160_25fps.mp4';

// Import images from Home images folder using import.meta.glob (handles spaces in folder name)
// Try different path patterns to handle folder name with space
const homeImageModules1 = import.meta.glob('../Home images/*.{png,jpg,jpeg}', { eager: true });
const homeImageModules2 = import.meta.glob('../Home%20images/*.{png,jpg,jpeg}', { eager: true });
const homeImageModules = { ...homeImageModules1, ...homeImageModules2 };

const homeImages: Record<string, string> = {};

// Map image filenames to variables
Object.entries(homeImageModules).forEach(([path, module]: [string, any]) => {
  const filename = path.split('/').pop() || '';
  const filenameLower = filename.toLowerCase();
  const imageUrl = typeof module === 'string' ? module : module.default || module;
  
  // Match by filename (case-insensitive)
  if (filenameLower.includes('cardio')) {
    homeImages['cardio'] = imageUrl;
  } else if (filenameLower.includes('strength')) {
    homeImages['strength'] = imageUrl;
  }
});

// Debug: Log what we found
console.log('Home image modules found:', Object.keys(homeImageModules));
console.log('Mapped home images:', homeImages);

// Use local images if found, otherwise fallback to Unsplash
const cardioImage = homeImages['cardio'] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop';
const strengthImage = homeImages['strength'] || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop';

console.log('Final cardio image:', cardioImage);
console.log('Final strength image:', strengthImage);

const PublicHome: React.FC<{ setCurrentPage: (p: string) => void }> = ({ setCurrentPage }) => {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Video Background */}
      <section className="relative h-[70vh] sm:h-[80vh] lg:h-[85vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 bg-slate-900">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop"
          >
            {/* Local video sources from video folder */}
            <source 
              src={video1} 
              type="video/mp4" 
            />
            <source 
              src={video2} 
              type="video/mp4" 
            />
            {/* Fallback image if video doesn't load */}
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop" 
              alt="Gym Atmosphere" 
              className="w-full h-full object-cover"
            />
          </video>
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/70 to-slate-900/50"></div>
          {/* Subtle animated overlay for dynamic effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 via-transparent to-blue-900/10 animate-pulse"></div>
        </div>
        
        {/* Content - Centered and Animated */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white w-full h-full flex items-center justify-center">
          <div className="max-w-4xl text-center">
            {/* Animated Badge */}
            <span 
              className="inline-block px-3 py-1 rounded-full bg-rose-600 text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in-up"
              style={{
                animation: 'fadeInUp 0.8s ease-out 0.2s both'
              }}
            >
              Goodlife Fitness
            </span>
            
            {/* Animated Headline */}
            <h1 
              className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-4 sm:mb-6 animate-fade-in-up px-4"
              style={{
                animation: 'fadeInUp 0.8s ease-out 0.4s both'
              }}
            >
              REDEFINE YOUR{' '}
              <span 
                className="text-rose-500 inline-block animate-slide-in-right"
                style={{
                  animation: 'slideInRight 0.8s ease-out 0.6s both'
                }}
              >
                STRENGTH
              </span>
            </h1>
            
            {/* Animated Description */}
            <p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-200 mb-6 sm:mb-10 leading-relaxed max-w-3xl mx-auto animate-fade-in-up px-4"
              style={{
                animation: 'fadeInUp 0.8s ease-out 0.8s both'
              }}
            >
              Join the most supportive fitness community in town. Premium equipment, expert training, and results that speak for themselves.
            </p>
            
            {/* Animated Buttons */}
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
              style={{
                animation: 'fadeInUp 0.8s ease-out 1s both'
              }}
            >
              <button 
                onClick={() => setCurrentPage('plans')}
                className="px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Join Now Today
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => setCurrentPage('about')}
                className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-bold rounded-lg transition-all border border-white/20 hover:border-white/40"
              >
                Explore Facilities
              </button>
            </div>
          </div>
        </div>
        
        {/* CSS Animations */}
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .animate-fade-in-up {
            animation-fill-mode: both;
          }
          
          .animate-slide-in-right {
            animation-fill-mode: both;
          }
        `}</style>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Why Choose Goodlife?</h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">We provide everything you need to reach your fitness goals, from beginner to elite levels.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Modern Equipment</h3>
              <p className="text-slate-600 leading-relaxed">Top-of-the-line cardio, strength, and functional equipment to optimize your training sessions.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">24/7 Access</h3>
              <p className="text-slate-600 leading-relaxed">Your schedule, your workout. Our flexible hours ensure you never miss a beat.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Expert Coaching</h3>
              <p className="text-slate-600 leading-relaxed">Our certified trainers are dedicated to helping you master form and maximize results.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Features Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">MEMBERSHIPS THAT FUEL YOUR FITNESS</h2>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto">Everything you need to achieve your fitness goals, all in one place.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              { icon: <Dumbbell size={32} />, text: 'Premium Equipment' },
              { icon: <Users size={32} />, text: 'Fitness Classes' },
              { icon: <Award size={32} />, text: 'Personal Training' },
              { icon: <Heart size={32} />, text: 'Mind & Body' },
              { icon: <Activity size={32} />, text: 'Cardio Zones' },
              { icon: <Target size={32} />, text: 'Strength Training' },
              { icon: <Sparkles size={32} />, text: 'Sauna & Spa' },
              { icon: <Clock size={32} />, text: '24/7 Access' }
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all">
                <div className="text-rose-600 mb-4">{feature.icon}</div>
                <p className="text-sm font-semibold text-slate-700">{feature.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={() => setCurrentPage('plans')}
              className="px-8 py-4 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors inline-flex items-center gap-2"
            >
              Explore Membership Options
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Fitness Classes Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Fitness Classes</h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">With 120+ classes to choose from, there's a class for everyone at GoodLife.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                title: 'CARDIO', 
                description: 'Get your heart pumping.',
                image: cardioImage,
                scheduleLink: '#'
              },
              { 
                title: 'STRENGTH', 
                description: 'Build muscle. Build confidence.',
                image: strengthImage,
                scheduleLink: '#'
              },
              { 
                title: 'MIND & BODY', 
                description: 'Find your centre.',
                image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
                scheduleLink: '#'
              },
              { 
                title: 'CYCLING', 
                description: 'Low impact. High intensity.',
                image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
                scheduleLink: '#'
              }
            ].map((classType, idx) => (
              <div key={idx} className="relative h-[400px] overflow-hidden bg-white shadow-lg group cursor-pointer">
                <div className="absolute inset-0 flex">
                  {/* Left Side - Text Content (White Background) */}
                  <div 
                    className="bg-white flex flex-col justify-center p-8 relative z-10"
                    style={{ width: '50%' }}
                  >
                    <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">{classType.title}</h3>
                    <p className="text-base text-slate-700 mb-6">{classType.description}</p>
                    <button className="text-rose-600 font-bold text-xs uppercase tracking-widest hover:text-rose-700 transition-colors self-start">
                      CLASS SCHEDULE
                    </button>
                  </div>
                  
                  {/* Right Side - Image with Diagonal Cut */}
                  <div 
                    className="relative overflow-hidden flex-1"
                    style={{
                      clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)',
                      marginLeft: '-1px'
                    }}
                  >
                    <img 
                      src={classType.image}
                      alt={classType.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Programs Section */}
      <section className="relative py-24 text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1920&h=1080&fit=crop&q=80)` }}
        >
          {/* Overlay - lighter so image is visible */}
          <div className="absolute inset-0 bg-slate-900/65"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 via-slate-800/65 to-slate-900/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Training Programs</h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Got goals? We'll help you reach them. Whether it's Personal, Team or Performance Training, our certified instructors are here to help you succeed.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { title: 'Personal Training', icon: <Users size={32} /> },
                { title: 'Group Training', icon: <Dumbbell size={32} /> },
                { title: 'Nutrition Coaching', icon: <Heart size={32} /> },
                { title: 'Performance Training', icon: <Target size={32} /> }
              ].map((program, idx) => (
                <div key={idx} className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-700/90 transition-colors">
                  <div className="text-rose-500 mb-4">{program.icon}</div>
                  <h3 className="font-bold text-lg">{program.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Goodlife Moments</h2>
            <p className="text-slate-600">Real stories from our members</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "I needed to do something all my own that would make me happy: lose the weight I'd gained and get into the best shape of my life. My confidence started to soar with the weight dropping, muscles toning and strengthening, and people noticing the physical changes.",
                author: "Karen W",
                rating: 5
              },
              {
                quote: "Since I started going to GoodLife, my confidence sky rocketed. What makes me feel even better since I've been going to GoodLife is that the people around me see a huge difference and want me to educate them about a healthier life.",
                author: "Lizz",
                rating: 5
              },
              {
                quote: "In 2004 I was diagnosed with severe onset Rheumatoid Arthritis. It took some years before I was able to get back to the GoodLife gym but with determination and believing I did it. I went from thinking I would never enter the gym again to now squatting 155lbs!",
                author: "Deborah L",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-all">
                <Quote className="text-rose-600 mb-4" size={32} />
                <p className="text-slate-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{testimonial.author}</span>
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative py-20 text-white overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop&q=80)` }}
        >
          {/* Overlay - lighter so image is visible */}
          <div className="absolute inset-0 bg-rose-600/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/50 via-rose-600/55 to-rose-900/50"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Mail size={48} className="mx-auto mb-6 text-rose-200" />
          <h2 className="text-3xl font-bold mb-4">Get Even More Goodlife</h2>
          <p className="text-rose-100 text-lg mb-8">Subscribe to our newsletter and get the latest updates, fitness info, and nutrition tips right to your inbox.</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-8 py-3 bg-white text-rose-600 font-bold rounded-lg hover:bg-slate-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Invite a Friend Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Share2 size={48} className="mx-auto mb-6 text-rose-600" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">INVITE A FRIEND</h2>
          <p className="text-slate-600 text-lg mb-8">Send someone you know a FREE workout and reach your fitness goals together.</p>
          <button className="px-8 py-4 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors inline-flex items-center gap-2">
            <Share2 size={20} />
            Invite a Friend
          </button>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="relative py-20 text-white text-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop&q=80)` }}
        >
          {/* Overlay - lighter so image is visible */}
          <div className="absolute inset-0 bg-rose-600/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/50 via-rose-600/55 to-rose-900/50"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-rose-100 mb-10">Sign up for a membership today and get your first week of personal training for free!</p>
          <button 
            onClick={() => setCurrentPage('plans')}
            className="px-10 py-4 bg-white text-rose-600 font-extrabold rounded-full hover:bg-slate-100 transition-colors shadow-xl"
          >
            SEE MEMBERSHIP PLANS
          </button>
        </div>
      </section>
    </div>
  );
};

export default PublicHome;
