import React from 'react';

interface SvgRendererProps {
  svgContent: string;
  className?: string;
}

export const SvgRenderer: React.FC<SvgRendererProps> = ({ svgContent, className = "" }) => {
  if (!svgContent) return null;

  return (
    <div
      className={`svg-render-container w-full h-full flex items-center justify-center ${className}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default SvgRenderer;
