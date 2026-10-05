import React from 'react';
import renderer, { act, ReactTestInstance } from 'react-test-renderer';
import { RegisterScreen } from '../screens/RegisterScreen';
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

const renderRegisterScreen = async (props?: {
  onNavigateToSignIn?: () => void;
  onNavigateToWelcome?: () => void;
  onRegisterSuccess?: (user: any) => void;
}) => {
  let component!: renderer.ReactTestRenderer;
  await act(async () => {
    component = renderer.create(
      <AuthProvider>
        <RegisterScreen
          onNavigateToSignIn={props?.onNavigateToSignIn || jest.fn()}
          onNavigateToWelcome={props?.onNavigateToWelcome || jest.fn()}
          onRegisterSuccess={props?.onRegisterSuccess}
        />
      </AuthProvider>,
    );
  });
  return component;
};

describe('RegisterScreen (Mobile Customer App)', () => {
  const mockNavigateToSignIn = jest.fn();
  const mockNavigateToWelcome = jest.fn();
  const mockRegisterSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.getCustomerSession.mockResolvedValue(null);
    mockedStorage.saveCustomerSession.mockResolvedValue();
    mockedStorage.clearCustomerSession.mockResolvedValue();
  });

  it('renders all required customer fields and labels', async () => {
    const component = await renderRegisterScreen();
    const allText = extractText(component.toJSON());

    expect(allText).toContain('Create Customer Account');
    expect(allText).toContain('First Name');
    expect(allText).toContain('Last Name');
    expect(allText).toContain('Username');
    expect(allText).toContain('Email Address');
    expect(allText).toContain('Password');
    expect(allText).toContain('Confirm Password');
    expect(allText).toContain('Create Customer Account');
    expect(allText).toContain('Sign In →');
  });

  it('validates empty required fields on submit', async () => {
    const component = await renderRegisterScreen();
    const root = component.root;

    const submitBtn = root.find(
      (node: ReactTestInstance) => node.props.testID === 'btn-submit-register',
    );

    await act(async () => {
      submitBtn.props.onPress();
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('First name is required');
    expect(allText).toContain('Last name is required');
    expect(allText).toContain('Username is required');
    expect(allText).toContain('Email address is required');
    expect(allText).toContain('Password is required');
    expect(allText).toContain('Confirm password is required');
  });

  it('validates password complexity and confirm password mismatch', async () => {
    const component = await renderRegisterScreen();
    const root = component.root;

    const firstNameInput = root.find(
      (n: ReactTestInstance) => n.props.testID === 'input-first-name',
    );
    const lastNameInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-last-name');
    const usernameInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-username');
    const emailInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-email');
    const passwordInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-password');
    const confirmPasswordInput = root.find(
      (n: ReactTestInstance) => n.props.testID === 'input-confirm-password',
    );
    const submitBtn = root.find((n: ReactTestInstance) => n.props.testID === 'btn-submit-register');

    await act(async () => {
      firstNameInput.props.onChangeText('Bilal');
      lastNameInput.props.onChangeText('Ahmed');
      usernameInput.props.onChangeText('bilalahmed');
      emailInput.props.onChangeText('bilal@example.pk');
      passwordInput.props.onChangeText('simple');
      confirmPasswordInput.props.onChangeText('different');
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('Password must meet all complexity requirements');
    expect(allText).toContain('Passwords do not match');
  });

  it('handles successful customer registration and shows details', async () => {
    mockedApi.registerCustomer.mockResolvedValueOnce({
      success: true,
      user: {
        id: 'cust-123',
        username: 'bilalahmed',
        email: 'bilal@example.pk',
        firstName: 'Bilal',
        lastName: 'Ahmed',
        role: 'Buyer',
        roleCode: 'CUST',
      },
    });

    const component = await renderRegisterScreen({
      onRegisterSuccess: mockRegisterSuccess,
    });
    const root = component.root;

    const firstNameInput = root.find(
      (n: ReactTestInstance) => n.props.testID === 'input-first-name',
    );
    const lastNameInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-last-name');
    const usernameInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-username');
    const emailInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-email');
    const passwordInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-password');
    const confirmPasswordInput = root.find(
      (n: ReactTestInstance) => n.props.testID === 'input-confirm-password',
    );
    const submitBtn = root.find((n: ReactTestInstance) => n.props.testID === 'btn-submit-register');

    await act(async () => {
      firstNameInput.props.onChangeText('Bilal');
      lastNameInput.props.onChangeText('Ahmed');
      usernameInput.props.onChangeText('bilalahmed');
      emailInput.props.onChangeText('bilal@example.pk');
      passwordInput.props.onChangeText('StrongPass123!');
      confirmPasswordInput.props.onChangeText('StrongPass123!');
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    expect(mockedApi.registerCustomer).toHaveBeenCalledWith({
      firstName: 'Bilal',
      lastName: 'Ahmed',
      username: 'bilalahmed',
      email: 'bilal@example.pk',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('Customer Account Created');
    expect(allText).toContain('Bilal');
    expect(allText).toContain('Ahmed');
    expect(allText).toContain('bilalahmed');
    expect(allText).toContain('bilal@example.pk');
    expect(allText).toContain('Proceed to Sign In');
  });

  it('displays API error banner when registration fails', async () => {
    mockedApi.registerCustomer.mockResolvedValueOnce({
      success: false,
      error: 'This username or email is already registered.',
    });

    const component = await renderRegisterScreen();
    const root = component.root;

    const firstNameInput = root.find(
      (n: ReactTestInstance) => n.props.testID === 'input-first-name',
    );
    const lastNameInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-last-name');
    const usernameInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-username');
    const emailInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-email');
    const passwordInput = root.find((n: ReactTestInstance) => n.props.testID === 'input-password');
    const confirmPasswordInput = root.find(
      (n: ReactTestInstance) => n.props.testID === 'input-confirm-password',
    );
    const submitBtn = root.find((n: ReactTestInstance) => n.props.testID === 'btn-submit-register');

    await act(async () => {
      firstNameInput.props.onChangeText('Bilal');
      lastNameInput.props.onChangeText('Ahmed');
      usernameInput.props.onChangeText('bilalahmed');
      emailInput.props.onChangeText('bilal@example.pk');
      passwordInput.props.onChangeText('StrongPass123!');
      confirmPasswordInput.props.onChangeText('StrongPass123!');
    });

    await act(async () => {
      submitBtn.props.onPress();
    });

    const allText = extractText(component.toJSON());
    expect(allText).toContain('This username or email is already registered.');
  });

  it('navigates to Sign In when link is pressed', async () => {
    const component = await renderRegisterScreen({
      onNavigateToSignIn: mockNavigateToSignIn,
    });
    const root = component.root;

    const signInLink = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === 'Navigate to customer sign in',
    );

    await act(async () => {
      signInLink.props.onPress();
    });

    expect(mockNavigateToSignIn).toHaveBeenCalledTimes(1);
  });

  it('navigates back to Welcome when back button is pressed', async () => {
    const component = await renderRegisterScreen({
      onNavigateToWelcome: mockNavigateToWelcome,
    });
    const root = component.root;

    const backBtn = root.find(
      (n: ReactTestInstance) => n.props.accessibilityLabel === '← Back to Welcome',
    );

    await act(async () => {
      backBtn.props.onPress();
    });

    expect(mockNavigateToWelcome).toHaveBeenCalledTimes(1);
  });
});
