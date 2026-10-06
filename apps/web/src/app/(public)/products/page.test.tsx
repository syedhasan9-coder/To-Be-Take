import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProductsCatalogPage from './page';
import { customerApi } from '../../../lib/customer-api';

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

jest.mock('../../../lib/customer-api', () => {
  const categories = [
    {
      id: 1,
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      count: 4,
      isActive: true,
    },
    {
      id: 4,
      name: 'Home & Living',
      slug: 'home-living',
      count: 6,
      isActive: true,
    },
    {
      id: 7,
      name: 'Beauty & Wellness',
      slug: 'beauty-wellness',
      count: 4,
      isActive: true,
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
      getProducts: jest.fn().mockImplementation((params: any) => {
        if (params.categorySlug === 'empty-cat') {
          return Promise.resolve({
            products: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 1 },
            availableCategories: categories,
          });
        }
        if (params.categorySlug === 'beauty-wellness') {
          return Promise.resolve({
            products: [products[1]],
            pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
            availableCategories: categories,
          });
        }
        return Promise.resolve({
          products,
          pagination: { page: 1, limit: 12, total: 2, totalPages: 1 },
          availableCategories: categories,
        });
      }),
    },
    getCustomerAuthToken: jest.fn().mockReturnValue(null),
    getCustomerStoredUser: jest.fn().mockReturnValue(null),
  };
});

jest.mock('../../../components/customer/CustomerContext', () => ({
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

describe('ProductsCatalogPage Component (/products)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('should render catalog headline and filter sidebar', async () => {
    render(<ProductsCatalogPage />);
    expect(screen.getByRole('heading', { level: 1, name: /Explore Pakistani Marketplace/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Filters/i })).toBeInTheDocument();
  });

  it('should list dynamic categories with product counts in the sidebar', async () => {
    render(<ProductsCatalogPage />);
    await waitFor(() => {
      expect(screen.getByText(/Beauty & Wellness \(4\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Home & Living \(6\)/i)).toBeInTheDocument();
    });
  });

  it('should filter products when a category radio is selected and sync URL', async () => {
    render(<ProductsCatalogPage />);
    await waitFor(() => {
      expect(screen.getByText(/Beauty & Wellness \(4\)/i)).toBeInTheDocument();
    });

    const beautyRadio = screen.getByRole('radio', { name: /Beauty & Wellness/i });
    fireEvent.click(beautyRadio);

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('categorySlug=beauty-wellness'), expect.anything());
  });

  it('should initialize category filter from URL query parameter (?categorySlug=beauty-wellness)', async () => {
    mockSearchParams = new URLSearchParams('categorySlug=beauty-wellness');
    render(<ProductsCatalogPage />);

    await waitFor(() => {
      expect(customerApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ categorySlug: 'beauty-wellness' }),
      );
    });
  });

  it('should render empty state when no products match filters', async () => {
    mockSearchParams = new URLSearchParams('categorySlug=empty-cat');
    render(<ProductsCatalogPage />);

    await waitFor(() => {
      expect(screen.getByText(/No matching products found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset All Filters/i })).toBeInTheDocument();
    });
  });

  it('should reset all filters when Reset All button is clicked', async () => {
    mockSearchParams = new URLSearchParams('categorySlug=beauty-wellness&search=oils');
    render(<ProductsCatalogPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset All/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Reset All/i }));
    expect(mockPush).toHaveBeenCalledWith('/products');
  });
});
