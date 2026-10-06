import React from 'react';
import renderer, { act, ReactTestInstance } from 'react-test-renderer';
import App, { ErrorBoundary } from '../../App';
import * as storage from '../services/storage';
import * as api from '../services/api';

jest.mock('../services/storage');
jest.mock('../services/api');

const mockedStorage = storage as jest.Mocked<typeof storage>;
const mockedApi = api as jest.Mocked<typeof api>;

function extractText(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (typeof json === 'number') return String(json);
  if (Array.isArray(json)) return json.map(extractText).join(' ');
  if (json.children) return extractText(json.children);
  return '';
}

describe('App Navigation & Customer Marketplace Startup Flow (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getCustomerSession.mockResolvedValue(null);
    mockedStorage.getCustomerToken.mockResolvedValue(null);
    mockedStorage.saveCustomerSession.mockResolvedValue();
    mockedStorage.clearCustomerSession.mockResolvedValue();

    mockedApi.getCustomerStorefront.mockResolvedValue({
      heroBanners: [],
      categories: [
        { id: 1, name: 'Ceramics & Pottery', slug: 'ceramics-pottery' },
        { id: 2, name: 'Organic Oils', slug: 'organic-oils' },
      ],
      featuredProducts: [],
      newArrivals: [],
      bestSellers: [],
      flashDeals: {
        id: 'f1',
        title: 'Flash Deals',
        endsAt: new Date().toISOString(),
        discountLabel: '20%',
        products: [],
      },
      sellerSpotlights: [],
      topDeals: [],
    } as any);
    mockedApi.getCustomerProducts.mockResolvedValue({
      products: [],
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    });
    mockedApi.getCustomerCart.mockResolvedValue({
      items: [],
      totalItems: 0,
      subtotal: 0,
      shippingFee: 0,
      discount: 0,
      grandTotal: 0,
      currency: 'PKR',
    });
    mockedApi.getCustomerWishlist.mockResolvedValue([]);
    mockedApi.getCustomerNotifications.mockResolvedValue({ unreadCount: 0, notifications: [] });
    mockedApi.getCustomerProfile.mockResolvedValue({
      id: 'cust-1',
      username: 'fatimakhan',
      email: 'fatima@example.pk',
      firstName: 'Fatima',
      lastName: 'Khan',
      role: 'Buyer',
      totalOrders: 0,
      totalWishlist: 0,
      totalReviews: 0,
      unreadNotifications: 0,
      joinedDate: new Date().toISOString(),
    });
  });

  it('renders Customer Marketplace (Home screen) by default on launch without requiring login', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce(null);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('ToBeTake');
    expect(allText).toContain('PAKISTANI LIFESTYLE MARKETPLACE');
    expect(allText).toContain('Explore Marketplace');
    expect(allText).not.toContain('Customer Sign In');
  });

  it('allows guest to navigate from Account tab to Sign In and back', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce(null);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    const root = component.root;
    // 1. Navigate to Account tab
    const accountTabBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Account tab',
    );
    await act(async () => {
      accountTabBtn.props.onPress();
    });

    let allText = extractText(component.toJSON());
    expect(allText).toContain('Customer Account');
    expect(allText).toContain('Welcome to To Be Take');
    expect(allText).toContain('Sign In as Customer');

    // 2. Click Sign In
    const signInBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Sign in as customer',
    );
    await act(async () => {
      signInBtn.props.onPress();
    });

    allText = extractText(component.toJSON());
    expect(allText).toContain('Customer Sign In');

    // 3. Back from Sign In
    const backBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === '← Back to Welcome',
    );
    await act(async () => {
      backBtn.props.onPress();
    });

    allText = extractText(component.toJSON());
    expect(allText).toContain('Customer Account');
    expect(allText).not.toContain('Customer Sign In');
  });

  it('allows guest to navigate from Account tab to Register and back', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce(null);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    const root = component.root;
    // 1. Navigate to Account tab
    const accountTabBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Account tab',
    );
    await act(async () => {
      accountTabBtn.props.onPress();
    });

    // 2. Click Create Account
    const registerBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Create customer account',
    );
    await act(async () => {
      registerBtn.props.onPress();
    });

    let allText = extractText(component.toJSON());
    expect(allText).toContain('Create Customer Account');

    // 3. Back from Register
    const backBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === '← Back to Welcome',
    );
    await act(async () => {
      backBtn.props.onPress();
    });

    allText = extractText(component.toJSON());
    expect(allText).toContain('Customer Account');
    expect(allText).not.toContain('Create Customer Account');
  });

  it('renders Customer Marketplace with authenticated user session when present', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce({
      id: 'cust-10',
      username: 'bilalahmed',
      email: 'bilal.ahmed@example.pk',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      role: 'Buyer',
      roleCode: 'CUST',
    });

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('ToBeTake');
    expect(allText).toContain('PAKISTANI LIFESTYLE MARKETPLACE');
    expect(allText).not.toContain('Customer Sign In');
  });

  it('allows customer to sign in from Account tab and logs in successfully', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce(null);
    mockedApi.loginCustomer.mockResolvedValueOnce({
      success: true,
      user: {
        id: 'cust-20',
        username: 'fatimakhan',
        email: 'fatima@example.pk',
        firstName: 'Fatima',
        lastName: 'Khan',
        role: 'Buyer',
        roleCode: 'CUST',
      },
      token: 'jwt-token-xyz',
    });

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    const root = component.root;
    // 1. Navigate to Account tab
    const accountTabBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Account tab',
    );
    await act(async () => {
      accountTabBtn.props.onPress();
    });

    // 2. Click Sign In
    const signInBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Sign in as customer',
    );
    await act(async () => {
      signInBtn.props.onPress();
    });

    // 3. Fill Credentials & Submit
    const identifierInput = root.find(
      (n: ReactTestInstance) => n.props.testID === 'input-identifier',
    );
    const passwordInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-password');
    const submitBtn = root.find((n: ReactTestInstance) => n.props.testID === 'btn-submit-login');

    await act(async () => {
      identifierInput.props.onChangeText('fatimakhan');
      passwordInput.props.onChangeText('SecurePass123!');
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('My Account');
    expect(allText).not.toContain('Customer Sign In');
    expect(mockedStorage.saveCustomerSession).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'fatimakhan' }),
      'jwt-token-xyz',
    );
  });

  it('catches render errors in ErrorBoundary and displays fallback UI', () => {
    const ProblemChild = () => {
      throw new Error('Test render explosion');
    };

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let component!: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>,
      );
    });

    spy.mockRestore();

    const allText = extractText(component.toJSON());
    expect(allText).toContain('Something went wrong');
    expect(allText).toContain('Reload Application');
  });
});
