'use client';

import { motion } from 'framer-motion';

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f7f6f3]">
      <div className="flex flex-col items-center space-y-6">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="relative"
        >
          {/* FaceCraft Logo - simplified circular design */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer ornamental circle */}
            <circle
              cx="60"
              cy="60"
              r="55"
              stroke="#c9982f"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8 4"
            />
            
            {/* Inner decorative circles */}
            <circle cx="40" cy="45" r="6" fill="#5c3a21" opacity="0.6" />
            <circle cx="80" cy="45" r="6" fill="#5c3a21" opacity="0.6" />
            
            {/* Face-inspired elements */}
            <circle cx="60" cy="60" r="35" stroke="#1f1b16" strokeWidth="2.5" fill="none" />
            <path
              d="M 45 55 Q 50 50 55 55"
              stroke="#1f1b16"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 65 55 Q 70 50 75 55"
              stroke="#1f1b16"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M 48 72 Q 60 80 72 72"
              stroke="#c9982f"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="text-center"
        >
          <h3 className="font-jakarta text-xl font-bold text-[#1f1b16] tracking-tight">
            Face Craft Studio
          </h3>
          <p className="font-nunito text-sm text-[#9a9286] mt-1">
            Where Technology Meets Tradition
          </p>
        </motion.div>
      </div>
    </div>
  );
}
