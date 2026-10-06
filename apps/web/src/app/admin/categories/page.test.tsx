import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminCategoriesPage from './page';

describe('AdminCategoriesPage Component (/admin/categories)', () => {
  const mockCategoriesResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'cat-1',
          name: 'Home & Kitchen',
          slug: 'home-and-kitchen',
          description: 'Appliances and home goods',
          parentId: null,
          parentName: null,
          isActive: true,
          productsCount: 15,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategoriesResponse),
      }),
    );
  });

  it('should render category list with product counts and slugs', async () => {
    render(<AdminCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Category Architecture')).toBeInTheDocument();
      expect(screen.getByText('Home & Kitchen')).toBeInTheDocument();
      expect(screen.getByText('home-and-kitchen')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });

  it('should open create category modal', async () => {
    render(<AdminCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('+ Create New Category')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Create New Category'));

    expect(screen.getByText('Create New Category')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Fine Jewelry & Gems/i)).toBeInTheDocument();
  });
});
