import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  BackHandler,
  Platform,
  TouchableOpacity,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/theme/colors';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CustomerCartProvider } from './src/context/CustomerCartContext';
import { CustomerTabBar } from './src/components/CustomerTabBar';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { OrderTrackingScreen } from './src/screens/OrderTrackingScreen';
import { WishlistScreen } from './src/screens/WishlistScreen';
import { AccountScreen } from './src/screens/AccountScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { AddressesScreen } from './src/screens/AddressesScreen';
import { ReviewsScreen } from './src/screens/ReviewsScreen';
import { OrdersListScreen } from './src/screens/OrdersListScreen';
import { ScreenMode, CustomerTabType, CustomerActiveView } from './src/types';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'An unexpected error occurred' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <StatusBar
            style="light"
            backgroundColor={colors.forest[800]}
            translucent={Platform.OS === 'android'}
          />
          <View style={styles.splashBrand}>
            <View style={styles.splashBrandDot} />
            <Text style={styles.splashBrandTitle}>To Be Take</Text>
          </View>
          <Text style={styles.errorHeading}>Something went wrong</Text>
          <Text style={styles.errorDescription}>
            The application encountered an unexpected issue while rendering.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleReset}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reload application"
          >
            <Text style={styles.retryButtonText}>Reload Application</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

function CustomerAppExperience(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<CustomerTabType>('home');
  const [viewStack, setViewStack] = useState<CustomerActiveView[]>([{ type: 'tab', tab: 'home' }]);
  const [catalogInitialCategory, setCatalogInitialCategory] = useState<string | undefined>();
  const [catalogInitialSearch, setCatalogInitialSearch] = useState<string | undefined>();

  const currentView = viewStack[viewStack.length - 1] || { type: 'tab', tab: activeTab };

  const pushView = (view: CustomerActiveView) => {
    setViewStack((prev) => [...prev, view]);
    if (view.type === 'tab') {
      setActiveTab(view.tab);
    }
  };

  const popView = () => {
    setViewStack((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.slice(0, prev.length - 1);
      const top = next[next.length - 1];
      if (top && top.type === 'tab') {
        setActiveTab(top.tab);
      }
      return next;
    });
  };

  // Hardware Back Button on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (viewStack.length > 1) {
        popView();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [viewStack]);

  const handleTabSelect = (tab: CustomerTabType) => {
    setActiveTab(tab);
    setViewStack([{ type: 'tab', tab }]);
  };

  const isTopLevelTab = currentView.type === 'tab';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        style="light"
        backgroundColor={colors.forest[900]}
        translucent={Platform.OS === 'android'}
      />
      <View style={styles.mainContent}>
        {currentView.type === 'tab' && currentView.tab === 'home' && (
          <HomeScreen
            onNavigateToCatalog={(cat, search) => {
              setCatalogInitialCategory(cat);
              setCatalogInitialSearch(search);
              handleTabSelect('catalog');
            }}
            onNavigateToProduct={(productId) => {
              pushView({ type: 'product-detail', productId });
            }}
            onNavigateToCart={() => handleTabSelect('cart')}
            onNavigateToNotifications={() => pushView({ type: 'account-notifications' })}
          />
        )}

        {currentView.type === 'tab' && currentView.tab === 'catalog' && (
          <CatalogScreen
            initialCategory={catalogInitialCategory}
            initialSearch={catalogInitialSearch}
            onNavigateToProduct={(productId) => {
              pushView({ type: 'product-detail', productId });
            }}
          />
        )}

        {currentView.type === 'tab' && currentView.tab === 'cart' && (
          <CartScreen
            onNavigateToCatalog={() => handleTabSelect('catalog')}
            onNavigateToCheckout={() => pushView({ type: 'checkout' })}
            onNavigateToProduct={(productId) => {
              pushView({ type: 'product-detail', productId });
            }}
          />
        )}

        {currentView.type === 'tab' && currentView.tab === 'wishlist' && (
          <WishlistScreen
            onNavigateToCatalog={() => handleTabSelect('catalog')}
            onNavigateToProduct={(productId) => {
              pushView({ type: 'product-detail', productId });
            }}
          />
        )}

        {currentView.type === 'tab' && currentView.tab === 'account' && (
          <AccountScreen
            onNavigateToOrders={() => pushView({ type: 'account-orders' })}
            onNavigateToAddresses={() => pushView({ type: 'account-addresses' })}
            onNavigateToNotifications={() => pushView({ type: 'account-notifications' })}
            onNavigateToReviews={() => pushView({ type: 'account-reviews' })}
            onNavigateToWishlist={() => handleTabSelect('wishlist')}
          />
        )}

        {currentView.type === 'product-detail' && (
          <ProductDetailScreen
            productId={currentView.productId}
            onNavigateBack={popView}
            onNavigateToCart={() => handleTabSelect('cart')}
            onNavigateToCheckout={() => pushView({ type: 'checkout' })}
          />
        )}

        {currentView.type === 'checkout' && (
          <CheckoutScreen
            onNavigateBack={popView}
            onOrderPlaced={(orderId) => {
              setViewStack([
                { type: 'tab', tab: 'home' },
                { type: 'order-tracking', orderId },
              ]);
            }}
          />
        )}

        {currentView.type === 'order-tracking' && (
          <OrderTrackingScreen
            orderId={currentView.orderId}
            onNavigateBack={popView}
            onNavigateToProduct={(productId) => pushView({ type: 'product-detail', productId })}
          />
        )}

        {currentView.type === 'account-orders' && (
          <OrdersListScreen
            onNavigateBack={popView}
            onSelectOrder={(orderId) => pushView({ type: 'order-tracking', orderId })}
          />
        )}

        {currentView.type === 'account-addresses' && (
          <AddressesScreen onNavigateBack={popView} />
        )}

        {currentView.type === 'account-notifications' && (
          <NotificationsScreen
            onNavigateBack={popView}
            onNavigateToOrder={(orderId) => pushView({ type: 'order-tracking', orderId })}
          />
        )}

        {currentView.type === 'account-reviews' && (
          <ReviewsScreen
            onNavigateBack={popView}
            onNavigateToProduct={(productId) => pushView({ type: 'product-detail', productId })}
          />
        )}
      </View>

      {/* Customer Bottom Navigation Bar (Visible on Top-Level Tabs) */}
      {isTopLevelTab && (
        <CustomerTabBar activeTab={activeTab} onSelectTab={handleTabSelect} />
      )}
    </SafeAreaView>
  );
}

function MainNavigator(): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const [unauthScreen, setUnauthScreen] = useState<Exclude<ScreenMode, 'home'>>('welcome');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar
          style="light"
          backgroundColor={colors.forest[800]}
          translucent={Platform.OS === 'android'}
        />
        <View style={styles.splashBrand}>
          <View style={styles.splashBrandDot} />
          <Text style={styles.splashBrandTitle}>ToBeTake</Text>
        </View>
        <ActivityIndicator size="large" color={colors.forest[800]} style={{ marginTop: 24 }} />
        <Text style={styles.splashLoadingText}>Curating pure Pakistani marketplace...</Text>
      </SafeAreaView>
    );
  }

  // Authenticated customer gets the full marketplace experience
  if (isAuthenticated) {
    return <CustomerAppExperience />;
  }

  // Unauthenticated flow
  switch (unauthScreen) {
    case 'sign-in':
      return (
        <SignInScreen
          onNavigateToRegister={() => setUnauthScreen('register')}
          onNavigateToWelcome={() => setUnauthScreen('welcome')}
        />
      );

    case 'register':
      return (
        <RegisterScreen
          onNavigateToSignIn={() => setUnauthScreen('sign-in')}
          onNavigateToWelcome={() => setUnauthScreen('welcome')}
        />
      );

    case 'welcome':
    default:
      return (
        <WelcomeScreen
          onNavigateToSignIn={() => setUnauthScreen('sign-in')}
          onNavigateToRegister={() => setUnauthScreen('register')}
        />
      );
  }
}

export default function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CustomerCartProvider>
          <MainNavigator />
        </CustomerCartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.forest[900],
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f8f5ee',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.linen[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.forest[800],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  splashBrandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold[500],
  },
  splashBrandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: -0.5,
  },
  splashLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.linen[200],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
