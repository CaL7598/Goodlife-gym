import React, { useState, useEffect, useRef, useMemo } from 'react';

// Dynamically import all images using Vite's import.meta.glob
// Include jpg, jpeg, and png formats
const imageModules = import.meta.glob('../images/*.{jpg,jpeg,png}', { eager: true });
const allImages = Object.values(imageModules).map((module: any) => 
  typeof module === 'string' ? module : module.default || module
) as string[];

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

const Gallery: React.FC<{ gallery?: GalleryImage[] }> = ({ gallery }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
  const galleryRef = useRef<HTMLDivElement>(null);

  // Use local images if available, otherwise fall back to gallery prop
  const images: GalleryImage[] = useMemo(() => {
    if (allImages.length > 0) {
      return allImages.map((img: string, index: number) => ({
        id: `img-${index}`,
        url: img,
        caption: `Goodlife Fitness Facility ${index + 1}`
      }));
    }
    return gallery || [];
  }, [gallery]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleImages((prev) => new Set([...prev, index]));
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    const imageElements = galleryRef.current?.querySelectorAll('[data-index]');
    imageElements?.forEach((el) => observer.observe(el));

    return () => {
      imageElements?.forEach((el) => observer.unobserve(el));
    };
  }, [images.length]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Our <span className="text-rose-600">Facilities</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Take a visual tour of Goodlife Fitness. Designed for performance, built for community.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="h-1 w-16 bg-rose-600 rounded-full"></div>
              <div className="h-1 w-8 bg-rose-400 rounded-full"></div>
              <div className="h-1 w-4 bg-rose-300 rounded-full"></div>
            </div>
          </div>

          {/* Masonry Grid Gallery */}
          <div 
            ref={galleryRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
          >
            {images.map((img, index) => {
              const isVisible = visibleImages.has(index);
              const delay = index * 0.05;
              
              // Vary the aspect ratios for visual interest
              const aspectRatios = [
                'aspect-[4/3]',
                'aspect-[3/4]',
                'aspect-square',
                'aspect-[16/9]',
                'aspect-[4/5]'
              ];
              const aspectClass = aspectRatios[index % aspectRatios.length];

              return (
                <div
                  key={img.id}
                  data-index={index}
                  className={`
                    group relative overflow-hidden rounded-2xl shadow-lg
                    ${aspectClass}
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                    transition-all duration-700 ease-out
                    cursor-pointer
                    hover:shadow-2xl hover:scale-[1.02]
                  `}
                  style={{
                    transitionDelay: `${delay}s`
                  }}
                  onClick={() => setSelectedImage(img.url)}
                >
                  {/* Image */}
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  {/* Caption */}
                  <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                    <div className="w-full">
                      <p className="text-white font-semibold text-lg mb-2">{img.caption}</p>
                      <div className="flex items-center gap-2 text-rose-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <span className="text-sm font-medium">Click to view</span>
                      </div>
                    </div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              );
            })}
          </div>

          {/* Image Count */}
          <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-slate-500 text-sm">
              Showing <span className="font-semibold text-rose-600">{images.length}</span> images
            </p>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            className="absolute top-4 right-4 z-10 text-white hover:text-rose-400 transition-colors duration-200 p-2 hover:bg-white/10 rounded-full"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Container */}
          <div
            className="relative max-w-7xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Gallery view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            />
          </div>

          {/* Navigation Hint */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 text-sm">
            Press ESC to close
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Gallery;
