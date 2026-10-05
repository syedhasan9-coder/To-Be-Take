import React from 'react';
import renderer, { act, ReactTestInstance } from 'react-test-renderer';
import { CustomerHomeScreen } from '../screens/CustomerHomeScreen';
import { AuthProvider } from '../context/AuthContext';
import * as storage from '../services/storage';

jest.mock('../services/storage');
const mockedStorage = storage as jest.Mocked<typeof storage>;

function extractText(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (typeof json === 'number') return String(json);
  if (Array.isArray(json)) return json.map(extractText).join(' ');
  if (json.children) return extractText(json.children);
  return '';
}

const renderCustomerHomeScreen = async (user: any) => {
  mockedStorage.getCustomerSession.mockResolvedValue(user);
  let component!: renderer.ReactTestRenderer;
  await act(async () => {
    component = renderer.create(
      <AuthProvider>
        <CustomerHomeScreen />
      </AuthProvider>,
    );
  });
  return component;
};

describe('CustomerHomeScreen (Mobile Customer App)', () => {
  const mockUser = {
    id: 'cust-99',
    username: 'sarahwalker',
    email: 'sarah.walker@example.com',
    firstName: 'Sarah',
    lastName: 'Walker',
    role: 'Buyer',
    roleCode: 'CUST',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getCustomerSession.mockResolvedValue(null);
    mockedStorage.saveCustomerSession.mockResolvedValue();
    mockedStorage.clearCustomerSession.mockResolvedValue();
  });

  it('renders customer greeting and badge', async () => {
    const component = await renderCustomerHomeScreen(mockUser);
    const allText = extractText(component.toJSON());
    expect(allText).toContain('Welcome back');
    expect(allText).toContain('Sarah');
    expect(allText).toContain('Verified Customer');
    expect(allText).toContain('You are securely signed in');
  });

  it('renders customer profile information accurately', async () => {
    const component = await renderCustomerHomeScreen(mockUser);
    const allText = extractText(component.toJSON());
    expect(allText).toContain('Account Details');
    expect(allText).toContain('Sarah Walker');
    expect(allText).toContain('sarahwalker');
    expect(allText).toContain('sarah.walker@example.com');
    expect(allText).toContain('Buyer');
    expect(allText).toContain('CUST');
  });

  it('allows signing out via the Sign Out button', async () => {
    const component = await renderCustomerHomeScreen(mockUser);
    const root = component.root;
    const logoutBtn = root.find((n: ReactTestInstance) => n.props.testID === 'btn-logout');
    expect(logoutBtn).toBeTruthy();

    await act(async () => {
      logoutBtn.props.onPress();
    });

    expect(mockedStorage.clearCustomerSession).toHaveBeenCalled();
  });
});
