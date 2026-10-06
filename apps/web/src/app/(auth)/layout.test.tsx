import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthLayout from './layout';

describe('AuthLayout Component ((auth) Shell)', () => {
  it('should render children without mounting CustomerHeader, CustomerFooter, or CustomerBottomNav', () => {
    const { container } = render(
      <AuthLayout>
        <div data-testid="test-auth-child">Auth Page Content</div>
      </AuthLayout>,
    );

    expect(screen.getByTestId('test-auth-child')).toBeInTheDocument();

    // Verify CustomerHeader and customer storefront navigation are NEVER mounted
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search products/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/all categories/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /wishlist/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /cart/i })).not.toBeInTheDocument();

    // Verify CustomerFooter and CustomerBottomNav are not mounted
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(container.querySelector('.customer-bottom-nav')).toBeNull();

    // Verify isolated auth-portal-shell is rendered
    expect(container.querySelector('.auth-portal-shell')).toBeInTheDocument();
  });
});
