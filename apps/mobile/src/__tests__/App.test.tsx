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

describe('App Navigation & Customer Marketplace Guard (Mobile)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getCustomerSession.mockResolvedValue(null);
    mockedStorage.getCustomerToken.mockResolvedValue(null);
    mockedStorage.saveCustomerSession.mockResolvedValue();
    mockedStorage.clearCustomerSession.mockResolvedValue();

    mockedApi.getCustomerStorefront.mockResolvedValue({
      heroBanners: [],
      categories: [],
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

  it('renders Welcome screen by default for unauthenticated users', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce(null);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('Welcome to To Be Take');
    expect(allText).toContain('Sign In');
    expect(allText).toContain('Create Account');
  });

  it('allows unauthenticated user to navigate from Welcome to Sign In and back', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce(null);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    let allText = extractText(component.toJSON());
    expect(allText).toContain('Welcome to To Be Take');

    const root = component.root;
    const signInBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Sign In to your customer account',
    );

    await act(async () => {
      signInBtn.props.onPress();
    });

    allText = extractText(component.toJSON());
    expect(allText).toContain('Customer Sign In');

    const backBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === '← Back to Welcome',
    );

    await act(async () => {
      backBtn.props.onPress();
    });

    allText = extractText(component.toJSON());
    expect(allText).toContain('Welcome to To Be Take');
    expect(allText).not.toContain('Customer Sign In');
  });

  it('allows unauthenticated user to navigate from Welcome to Register and back', async () => {
    mockedStorage.getCustomerSession.mockResolvedValueOnce(null);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<App />);
    });

    let allText = extractText(component.toJSON());
    expect(allText).toContain('Welcome to To Be Take');

    const root = component.root;
    const createAccountBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Create a new customer account',
    );

    await act(async () => {
      createAccountBtn.props.onPress();
    });

    allText = extractText(component.toJSON());
    expect(allText).toContain('Create Customer Account');

    const backBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === '← Back to Welcome',
    );

    await act(async () => {
      backBtn.props.onPress();
    });

    allText = extractText(component.toJSON());
    expect(allText).toContain('Welcome to To Be Take');
    expect(allText).not.toContain('Create Customer Account');
  });

  it('renders Customer Marketplace directly when stored session is present', async () => {
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
    expect(allText).toContain('Explore');
    expect(allText).not.toContain('Customer Sign In');
  });

  it('navigates to Customer Marketplace on successful login', async () => {
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
    const welcomeSignInBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Sign In to your customer account',
    );

    await act(async () => {
      welcomeSignInBtn.props.onPress();
    });

    let allText = extractText(component.toJSON());
    expect(allText).toContain('Customer Sign In');

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

    allText = extractText(component.toJSON());
    expect(allText).toContain('ToBeTake');
    expect(allText).toContain('PAKISTANI LIFESTYLE MARKETPLACE');
    expect(allText).not.toContain('Customer Sign In');
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
