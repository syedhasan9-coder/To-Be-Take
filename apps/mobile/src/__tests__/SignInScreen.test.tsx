import React from 'react';
import renderer, { act, ReactTestInstance } from 'react-test-renderer';
import { SignInScreen } from '../screens/SignInScreen';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';
import * as storage from '../services/storage';

jest.mock('../services/api');
jest.mock('../services/storage');

const mockedApi = api as jest.Mocked<typeof api>;
const mockedStorage = storage as jest.Mocked<typeof storage>;

function extractText(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (typeof json === 'number') return String(json);
  if (Array.isArray(json)) return json.map(extractText).join(' ');
  if (json.children) return extractText(json.children);
  return '';
}

const renderSignInScreen = async (props?: {
  onNavigateToRegister?: () => void;
  onNavigateToWelcome?: () => void;
  onLoginSuccess?: () => void;
}) => {
  let component!: renderer.ReactTestRenderer;
  await act(async () => {
    component = renderer.create(
      <AuthProvider>
        <SignInScreen
          onNavigateToRegister={props?.onNavigateToRegister || jest.fn()}
          onNavigateToWelcome={props?.onNavigateToWelcome || jest.fn()}
          onLoginSuccess={props?.onLoginSuccess}
        />
      </AuthProvider>,
    );
  });
  return component;
};

describe('SignInScreen (Mobile Customer App)', () => {
  const mockNavigateToRegister = jest.fn();
  const mockNavigateToWelcome = jest.fn();
  const mockLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getCustomerSession.mockResolvedValue(null);
    mockedStorage.saveCustomerSession.mockResolvedValue();
    mockedStorage.clearCustomerSession.mockResolvedValue();
  });

  it('renders customer sign in title, inputs and buttons', async () => {
    const component = await renderSignInScreen();
    const allText = extractText(component.toJSON());

    expect(allText).toContain('Customer Sign In');
    expect(allText).toContain('Username or Email');
    expect(allText).toContain('Password');
    expect(allText).toContain('Sign In as Customer');
    expect(allText).toContain('Create Account →');
  });

  it('validates empty required fields on submit', async () => {
    const component = await renderSignInScreen();
    const root = component.root;

    const submitBtn = root.find(
      (node: ReactTestInstance) => node.props.testID === 'btn-submit-login',
    );

    await act(async () => {
      submitBtn.props.onPress();
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('Username or email is required');
    expect(allText).toContain('Password is required');
  });

  it('handles successful customer login and invokes callback', async () => {
    mockedApi.loginCustomer.mockResolvedValueOnce({
      success: true,
      user: {
        id: 'cust-1',
        username: 'bilalahmed',
        email: 'bilal@example.pk',
        firstName: 'Bilal',
        lastName: 'Ahmed',
        role: 'Buyer',
        roleCode: 'CUST',
      },
    });

    const component = await renderSignInScreen({
      onLoginSuccess: mockLoginSuccess,
    });
    const root = component.root;

    const identifierInput = root.find(
      (node: ReactTestInstance) => node.props.testID === 'input-identifier',
    );
    const passwordInput = root.find(
      (node: ReactTestInstance) => node.props.testID === 'input-password',
    );
    const submitBtn = root.find(
      (node: ReactTestInstance) => node.props.testID === 'btn-submit-login',
    );

    await act(async () => {
      identifierInput.props.onChangeText('bilalahmed');
      passwordInput.props.onChangeText('Password123!');
    });

    await act(async () => {
      await submitBtn.props.onPress();
    });

    expect(mockedApi.loginCustomer).toHaveBeenCalledWith('bilalahmed', 'Password123!');
    expect(mockLoginSuccess).toHaveBeenCalledTimes(1);
  });

  it('displays API error banner when credentials are invalid', async () => {
    mockedApi.loginCustomer.mockResolvedValueOnce({
      success: false,
      error: 'Invalid username or password',
    });

    const component = await renderSignInScreen();
    const root = component.root;

    const identifierInput = root.find(
      (node: ReactTestInstance) => node.props.testID === 'input-identifier',
    );
    const passwordInput = root.find(
      (node: ReactTestInstance) => node.props.testID === 'input-password',
    );
    const submitBtn = root.find(
      (node: ReactTestInstance) => node.props.testID === 'btn-submit-login',
    );

    await act(async () => {
      identifierInput.props.onChangeText('wronguser');
      passwordInput.props.onChangeText('wrongpass');
    });

    await act(async () => {
      await submitBtn.props.onPress();
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('Invalid username or password');
  });

  it('navigates to register screen when Create Account link is pressed', async () => {
    const component = await renderSignInScreen({
      onNavigateToRegister: mockNavigateToRegister,
    });
    const root = component.root;

    const registerBtn = root.find(
      (node: ReactTestInstance) =>
        node.props.accessibilityLabel === 'Navigate to customer registration',
    );

    await act(async () => {
      registerBtn.props.onPress();
    });

    expect(mockNavigateToRegister).toHaveBeenCalledTimes(1);
  });

  it('navigates back to welcome screen when back button is pressed', async () => {
    const component = await renderSignInScreen({
      onNavigateToWelcome: mockNavigateToWelcome,
    });
    const root = component.root;

    const backBtn = root.find(
      (node: ReactTestInstance) => node.props.accessibilityLabel === '← Back to Welcome',
    );

    await act(async () => {
      backBtn.props.onPress();
    });

    expect(mockNavigateToWelcome).toHaveBeenCalledTimes(1);
  });
});
