import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f5f5f5"/%3E%3C/svg%3E',
  width = undefined,
  height = undefined,
  sizes = undefined,
  priority = false
}) {
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder);
  const [isLoaded, setIsLoaded] = useState(priority);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            setImageSrc(src);
            if (observerRef.current) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      { 
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    const currentRef = imgRef.current;
    if (currentRef && observerRef.current) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (currentRef && observerRef.current) {
        observerRef.current.unobserve(currentRef);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority, isInView]);

  // Preload if priority
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  }, [priority, src]);

  const imgProps = {
    ref: imgRef,
    src: imageSrc,
    alt: alt,
    className: `${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 ease-in-out`,
    onLoad: handleLoad,
    onError: () => {
      setIsLoaded(true); // Show placeholder on error
    },
    loading: priority ? "eager" : "lazy",
    decoding: "async"
  };

  if (width) imgProps.width = width;
  if (height) imgProps.height = height;
  if (sizes) imgProps.sizes = sizes;
  if (priority && 'fetchPriority' in Image.prototype) {
    imgProps.fetchPriority = "high";
  }

  const imgElement = <img {...imgProps} />;

  // If width/height provided, wrap in container for better control
  if (width || height) {
    return (
      <div className="relative overflow-hidden" style={{ width, height }}>
        {imgElement}
        {!isLoaded && (
          <div className="absolute inset-0 bg-stone-100 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {imgElement}
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-100 animate-pulse flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
        </div>
      )}
    </>
  );
}