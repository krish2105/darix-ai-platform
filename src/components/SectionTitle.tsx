import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './Button';
import { fadeIn } from '@/utils/animations';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  subtitle, 
  align = 'center',
  className 
}) => {
  const alignmentClass = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  }[align];

  return (
    <motion.div 
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={cn('mb-12 max-w-3xl', alignmentClass, className)}
    >
      <h2 className="text-3xl md:text-5xl font-bold mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-muted-foreground">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
