import { RegisterUserInput, LoginInput } from '@tobetake/shared-types';

export interface CustomerUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleCode: string;
  createdAt?: string | Date;
}

export type ScreenMode = 'welcome' | 'sign-in' | 'register' | 'home';

export type CustomerTabType = 'home' | 'catalog' | 'cart' | 'wishlist' | 'account';

export type CustomerActiveView =
  | { type: 'tab'; tab: CustomerTabType }
  | { type: 'product-detail'; productId: string; returnTab?: CustomerTabType }
  | { type: 'checkout' }
  | { type: 'order-tracking'; orderId: string }
  | { type: 'account-orders' }
  | { type: 'account-addresses' }
  | { type: 'account-notifications' }
  | { type: 'account-reviews' };

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  identifier?: string;
  general?: string;
}

export type CustomerLoginInput = LoginInput;
export type CustomerRegisterInput = RegisterUserInput;

