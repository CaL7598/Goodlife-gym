
import React from 'react';
import { ShieldCheck, Target, Users2 } from 'lucide-react';
import ImageSlideshow from '../components/ImageSlideshow';

// Dynamically import all images from the "our story" folder using Vite's import.meta.glob
const storyImageModules = import.meta.glob('../our story/*.{jpg,jpeg,png}', { eager: true });
const storyImages = Object.values(storyImageModules).map((module: any) => 
  typeof module === 'string' ? module : module.default || module
) as string[];

const About: React.FC = () => {
  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">Our Story</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Founded in <strong>January 2014</strong>, Goodlife Fitness Ghana is a dynamic fitness community dedicated to empowering individuals on their wellness journeys. We have two locations, the <strong>Sunyani Airport Branch</strong> and <strong>Wamfie Branch</strong>, in the Bono Region, and also the upcoming <strong>Sunyani Baakoniaba Branch</strong>.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              We offer <strong>Personal Training</strong>, <strong>Aerobics Classes</strong>, <strong>Bodybuilding</strong> and <strong>Small Group Classes</strong> to help you improve your health & fitness so you can live a good life. Goodlife Fitness Ghana welcomes all ages and fitness abilities. Our classes are structured so that no matter your level of fitness and experience, you get a perfect workout for you.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Goodlife Fitness Ghana is to give every person in Ghana the opportunity to live a fit and healthy good life.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Please check out our intro offers or phone us to kick off your fitness journey!
            </p>
            <p className="text-2xl font-bold text-rose-600 italic mt-6">
              DO IT FOR YOUR GOOD LIFE.
            </p>
          </div>
          <div className="group rotate-2">
            <ImageSlideshow 
              images={storyImages}
              autoPlay={true}
              autoPlayInterval={5000}
              showControls={true}
              showIndicators={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="bg-slate-50 p-10 rounded-3xl text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <ShieldCheck className="text-rose-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Our Mission</h3>
            <p className="text-slate-500 text-sm leading-relaxed">To give every person in Ghana the opportunity to live a fit and healthy good life.</p>
          </div>
          <div className="bg-slate-50 p-10 rounded-3xl text-center">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Target className="text-rose-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Our Services</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Personal Training, Aerobics Classes, Bodybuilding, and Small Group Classes tailored to all fitness levels.</p>
          </div>
          <div className="bg-slate-50 p-10 rounded-3xl text-center">
             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users2 className="text-rose-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Our Community</h3>
            <p className="text-slate-500 text-sm leading-relaxed">A dynamic fitness community welcoming all ages and fitness abilities across the Bono Region.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
