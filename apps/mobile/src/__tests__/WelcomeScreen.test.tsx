import React from 'react';
import renderer, { act, ReactTestInstance } from 'react-test-renderer';
import { WelcomeScreen } from '../screens/WelcomeScreen';

function extractText(json: any): string {
  if (!json) return '';
  if (typeof json === 'string') return json;
  if (typeof json === 'number') return String(json);
  if (Array.isArray(json)) return json.map(extractText).join(' ');
  if (json.children) return extractText(json.children);
  return '';
}

describe('WelcomeScreen (Mobile Customer App)', () => {
  const mockNavigateToSignIn = jest.fn();
  const mockNavigateToRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders branding and customer introduction correctly', () => {
    let component!: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <WelcomeScreen
          onNavigateToSignIn={mockNavigateToSignIn}
          onNavigateToRegister={mockNavigateToRegister}
        />,
      );
    });

    const allText = extractText(component.toJSON());

    expect(allText).toContain('To Be Take');
    expect(allText).toContain('Customer App');
    expect(allText).toContain('Welcome to To Be Take');
    expect(allText).toContain(
      'Discover products, shop from verified sellers, and manage your orders.',
    );
  });

  it('renders customer value propositions', () => {
    let component!: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <WelcomeScreen
          onNavigateToSignIn={mockNavigateToSignIn}
          onNavigateToRegister={mockNavigateToRegister}
        />,
      );
    });

    const allText = extractText(component.toJSON());

    expect(allText).toContain('Discover verified stores & quality products');
    expect(allText).toContain('Fast, safe & secure checkout');
    expect(allText).toContain('Real-time order tracking & purchase history');
  });

  it('navigates to Sign In when Primary "Sign In" button is pressed', () => {
    let component!: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <WelcomeScreen
          onNavigateToSignIn={mockNavigateToSignIn}
          onNavigateToRegister={mockNavigateToRegister}
        />,
      );
    });

    const root = component.root;
    const signInBtn = root.find(
      (node: ReactTestInstance) =>
        node.props.accessibilityLabel === 'Sign In to your customer account',
    );
    act(() => {
      signInBtn.props.onPress();
    });

    expect(mockNavigateToSignIn).toHaveBeenCalledTimes(1);
  });

  it('navigates to Register when Secondary "Create Account" button is pressed', () => {
    let component!: renderer.ReactTestRenderer;
    act(() => {
      component = renderer.create(
        <WelcomeScreen
          onNavigateToSignIn={mockNavigateToSignIn}
          onNavigateToRegister={mockNavigateToRegister}
        />,
      );
    });

    const root = component.root;
    const createAccountBtn = root.find(
      (node: ReactTestInstance) =>
        node.props.accessibilityLabel === 'Create a new customer account',
    );
    act(() => {
      createAccountBtn.props.onPress();
    });

    expect(mockNavigateToRegister).toHaveBeenCalledTimes(1);
  });
});
