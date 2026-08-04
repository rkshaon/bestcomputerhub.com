// File: /types/hero.ts

export interface HeroPrimaryAction {
  label: string;
  href: string;
}

export interface HeroPrimaryBanner {
  badgeIcon?: string;
  badgeText: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix?: string;
  description: string;
  image: string;
  primaryAction: HeroPrimaryAction;
  secondaryAction?: HeroPrimaryAction;
}

export interface HeroSecondaryBanner {
  badgeIcon?: string;
  badgeText: string;
  badgeVariant?: 'primary' | 'emerald' | 'amber' | 'blue';
  title: string;
  description: string;
  image: string;
  href: string;
}

export interface HeroSlideData {
  id: string;
  primary: HeroPrimaryBanner;
  secondary: [HeroSecondaryBanner, HeroSecondaryBanner];
}
