import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HomePage from './page';
import { customerApi } from '../../lib/customer-api';

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock customer Api with inline mock data to satisfy Jest hoisting
jest.mock('../../lib/customer-api', () => {
  const categories = [
    {
      id: 1,
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      productCount: 4,
      isActive: true,
      displayOrder: 1,
    },
    {
      id: 4,
      name: 'Home & Living',
      slug: 'home-living',
      productCount: 6,
      isActive: true,
      displayOrder: 2,
    },
    {
      id: 7,
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      productCount: 4,
      isActive: true,
      displayOrder: 3,
    },
  ];

  const products = [
    {
      id: 'prod-001',
      name: 'Multan Blue Pottery Vase',
      slug: 'multan-blue-pottery-vase',
      sku: 'ART-CER-001',
      description: 'Authentic handcrafted vase.',
      price: 4500,
      compareAtPrice: 5500,
      status: 'ACTIVE',
      images: ['https://example.com/vase.jpg'],
      categoryId: 5,
      categoryName: 'Ceramics & Tableware',
      rating: 4.8,
      reviewCount: 12,
      inStock: true,
    },
    {
      id: 'prod-002',
      name: 'Swat Rosehip Oil 30ml',
      slug: 'swat-rosehip-oil-30ml',
      sku: 'BOT-OIL-002',
      description: 'Cold pressed organic oil.',
      price: 2200,
      status: 'ACTIVE',
      images: ['https://example.com/oil.jpg'],
      categoryId: 8,
      categoryName: 'Botanical Skincare',
      rating: 4.9,
      reviewCount: 20,
      inStock: true,
    },
  ];

  return {
    customerApi: {
      getStorefront: jest.fn().mockResolvedValue({
        featuredProducts: [products[0]],
        newArrivals: [],
        bestSellers: [],
        flashDeals: {
          id: 'flash-1',
          title: "Today's Flash Deals",
          endsAt: '2026-10-06T00:00:00Z',
          products: [],
        },
        categories,
        sellerSpotlights: [],
      }),
      getProducts: jest.fn().mockImplementation((params: any) => {
        if (params.categorySlug === 'beauty-wellness' || params.categorySlug === 'botanical-skincare') {
          return Promise.resolve({
            products: [products[1]],
            pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
            availableCategories: categories,
          });
        }
        if (params.categorySlug === 'empty-cat') {
          return Promise.resolve({
            products: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
            availableCategories: categories,
          });
        }
        return Promise.resolve({
          products,
          pagination: { page: 1, limit: 12, total: 2, totalPages: 1 },
          availableCategories: categories,
        });
      }),
      getCategories: jest.fn().mockResolvedValue(categories),
    },
    getCustomerAuthToken: jest.fn().mockReturnValue(null),
    getCustomerStoredUser: jest.fn().mockReturnValue(null),
  };
});

jest.mock('../../components/customer/CustomerContext', () => ({
  useCustomer: () => ({
    user: null,
    isAuthenticated: false,
    cartCount: 0,
    wishlistCount: 0,
    addToCart: jest.fn(),
    toggleWishlist: jest.fn(),
    isWishlisted: () => false,
  }),
}));

describe('HomePage Component (Customer Storefront & Category Filtering)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe('Hero and Storefront Branding', () => {
    it('should render the authentic Pakistani heritage hero headline', async () => {
      render(<HomePage />);
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Authentic Pakistani Artisanal & Botanical Heritage/i,
        }),
      ).toBeInTheDocument();
    });

    it('should render the Explore Catalog primary CTA link', () => {
      render(<HomePage />);
      const exploreBtn = screen.getByRole('link', { name: /Explore Catalog/i });
      expect(exploreBtn).toBeInTheDocument();
      expect(exploreBtn).toHaveAttribute('href', '/products');
    });

    it('should render the curated category section heading', () => {
      render(<HomePage />);
      expect(
        screen.getByRole('heading', { level: 2, name: /Shop by Curated Category/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Live Category Filtering & URL Query Sync', () => {
    it('should render category filter chips including All Products and dynamic categories', async () => {
      render(<HomePage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /All Products/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Beauty & Wellness/i })).toBeInTheDocument();
      });
    });

    it('should fetch category products and update URL query when a category chip is clicked', async () => {
      render(<HomePage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Beauty & Wellness/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Beauty & Wellness/i }));

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('categorySlug=beauty-wellness'), expect.anything());
      await waitFor(() => {
        expect(customerApi.getProducts).toHaveBeenCalledWith(
          expect.objectContaining({ categorySlug: 'beauty-wellness' }),
        );
      });
    });

    it('should restore complete showcase when All Products or Clear Category is clicked', async () => {
      mockSearchParams = new URLSearchParams('categorySlug=beauty-wellness');
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Clear Category/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Clear Category/i }));
      expect(mockPush).toHaveBeenCalledWith('/', expect.anything());
    });

    it('should render professional empty state when a category has 0 matching products', async () => {
      mockSearchParams = new URLSearchParams('categorySlug=empty-cat');
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText(/No products found/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /View All Products/i })).toBeInTheDocument();
      });
    });
  });
});
