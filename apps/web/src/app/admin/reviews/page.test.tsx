import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminReviewsPage from './page';

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

describe('AdminReviewsPage Component (/admin/reviews)', () => {
  const mockReviewsResponse = {
    success: true,
    data: {
      items: [
        {
          id: 'rev-1',
          productId: 'prod-1',
          productTitle: 'Handmade Wooden Table',
          customerId: 'cust-1',
          customerName: 'Diana Reviewer',
          customerEmail: 'diana@example.com',
          storeName: 'Timber & Oak',
          rating: 5,
          title: 'Exceptional craftsmanship!',
          content: 'Solid wood and magnificent finish. Highly recommended.',
          status: 'PUBLISHED',
          isFlagged: false,
          adminNotes: null,
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReviewsResponse),
      }),
    );
  });

  it('should render customer reviews table with rating and content', async () => {
    render(<AdminReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Product Reviews & Moderation')).toBeInTheDocument();
      expect(screen.getByText('Handmade Wooden Table')).toBeInTheDocument();
      expect(screen.getByText('Diana Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Exceptional craftsmanship!')).toBeInTheDocument();
    });
  });

  it('should open review moderation modal', async () => {
    render(<AdminReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Moderate'));

    expect(screen.getByText(/Moderate Review for "Handmade Wooden Table"/i)).toBeInTheDocument();
    expect(screen.getByText('Visibility Status')).toBeInTheDocument();
  });
});
