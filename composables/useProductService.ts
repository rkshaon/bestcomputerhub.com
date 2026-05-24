import type { Category } from '@/types';

export const useProductService = () => {
  const getCategories = (): Category[] => {
    return [
      {
        id: '1',
        name: 'Processors',
        slug: 'processors',
        description: 'High-performance CPU units for workstations and servers.',
        subCategories: ['4']
      },
      {
        id: '2',
        name: 'Graphics Cards',
        slug: 'graphics-cards',
        description: 'Elite GPUs for modern visual rendering and training acceleration.',
        subCategories: []
      },
      {
        id: '3',
        name: 'Workstations',
        slug: 'workstations',
        description: 'Enterprise grade custom computed platforms.',
        subCategories: []
      },
      {
        id: '4',
        name: 'Workstation Processors',
        slug: 'workstation-processors',
        description: 'Specialized enterprise processors.',
        parentCategoryId: '1',
        subCategories: []
      }
    ];
  };

  return {
    getCategories
  };
};
