import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <h2
      className={`text-xl md:text-2xl font-black text-[#2B3674] tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
};

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className = "", ...props }) => {
  return (
    <p className={`text-xs md:text-sm text-gray-500 font-medium mt-0.5 ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`flex items-center justify-between pt-4 mt-4 border-t border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
