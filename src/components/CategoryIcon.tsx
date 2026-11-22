import React from 'react';
import {
  Briefcase,
  Car,
  Droplets,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Milk,
  Plane,
  Receipt,
  Shield,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Truck,
  Utensils,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBasket,
  Milk,
  Fuel,
  Truck,
  Zap,
  Droplets,
  Smartphone,
  Wifi,
  ShoppingBag,
  GraduationCap,
  HeartPulse,
  Home,
  Car,
  Utensils,
  Receipt,
  Wrench,
  Plane,
  Gift,
  Dumbbell,
  Briefcase,
  Shield,
  Sparkles,
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5' }) => {
  const Icon = ICON_MAP[name] ?? Receipt;
  return <Icon className={className} aria-hidden="true" />;
};
