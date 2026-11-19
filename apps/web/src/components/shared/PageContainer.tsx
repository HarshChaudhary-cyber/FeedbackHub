import React from 'react';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  size = 'default',
  ...props
}) => {
  const maxW =
    size === 'narrow'
      ? 'max-w-4xl'
      : size === 'wide'
      ? 'max-w-[1400px]'
      : 'max-w-7xl';

  return (
    <div
      className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxW} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
