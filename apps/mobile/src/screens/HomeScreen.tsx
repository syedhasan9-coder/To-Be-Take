import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerStorefrontData, CustomerStorefrontProduct } from '@tobetake/shared-types';
import { getCustomerStorefront } from '../services/api';
import { useCustomerCart } from '../context/CustomerCartContext';
import { AppIcon } from '../components/AppIcon';
import { ProductCard, DEFAULT_CARD_WIDTH } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { CategoryVisualIcon } from '../components/CategoryVisual';
import { formatRating, safeString, getInitials } from '../utils/formatters';

const { width } = Dimensions.get('window');
const DEAL_CARD_WIDTH = 160;

interface HomeScreenProps {
  onNavigateToCatalog: (categorySlug?: string, search?: string) => void;
  onNavigateToProduct: (productId: string) => void;
  onNavigateToCart: () => void;
  onNavigateToNotifications: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToCatalog,
  onNavigateToProduct,
  onNavigateToCart,
  onNavigateToNotifications,
}) => {
  const { addToCart, toggleWishlist, isWishlisted, cartCount, unreadNotificationsCount } =
    useCustomerCart();
  const [data, setData] = useState<CustomerStorefrontData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await getCustomerStorefront();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load marketplace content');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddToCart = async (product: CustomerStorefrontProduct) => {
    setAddingId(product.id);
    await addToCart(product.id, 1);
    setAddingId(null);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.safeContainer}>
        {/* Top Header Placeholder */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandTitle}>ToBeTake</Text>
          </View>
        </View>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={{ padding: 16 }}>
            <ProductSkeleton count={4} />
          </View>
        </ScrollView>
      </View>
    );
  }

  const flashDealProducts = data?.flashDeals?.products || data?.topDeals || [];
  const sellers = data?.sellerSpotlights || [];

  return (
    <View style={styles.safeContainer}>
      {/* Top App Bar with Branding and Actions */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <View>
            <Text style={styles.brandTitle}>ToBeTake</Text>
            <Text style={styles.brandSub}>PAKISTANI LIFESTYLE MARKETPLACE</Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNavigateToNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <AppIcon name="notifications-outline" size={20} color="#ffffff" />
            {unreadNotificationsCount > 0 && <View style={styles.notifBadge} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNavigateToCart}
            accessibilityRole="button"
            accessibilityLabel="Shopping Cart"
          >
            <AppIcon name="cart-outline" size={20} color="#ffffff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.forest[800]]}
            tintColor={colors.forest[800]}
          />
        }
      >
        {/* Search Bar Shortcut */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => onNavigateToCatalog()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Search marketplace"
        >
          <AppIcon name="search" size={18} color="#718077" />
          <Text style={styles.searchPlaceholder}>
            Search dry fruits, pottery, oils, tech, shawls...
          </Text>
        </TouchableOpacity>

        {/* Hero Banner with Botanical Feel */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>AUTHENTIC HERITAGE</Text>
          </View>
          <Text style={styles.heroTitle}>
            Pure Pakistani Craftsmanship & Artisanal Goods
          </Text>
          <Text style={styles.heroSubtitle}>
            Direct from Multan potters, Swat botanicals, Khewra salt, and Gilgit orchards.
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => onNavigateToCatalog()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Explore Marketplace"
          >
            <Text style={styles.heroBtnText}>Explore Marketplace →</Text>
          </TouchableOpacity>
        </View>

        {/* Category Carousel */}
        {data?.categories && data.categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity
                onPress={() => onNavigateToCatalog()}
                accessibilityRole="button"
                accessibilityLabel="View all categories"
              >
                <Text style={styles.seeAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {data.categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCard}
                  onPress={() => onNavigateToCatalog(cat.slug)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${cat.name}`}
                >
                  <CategoryVisualIcon
                    slugOrName={cat.slug}
                    size={22}
                    containerSize={48}
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.categoryName} numberOfLines={2}>
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryCount}>Explore</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Flash Deals / Special Offers */}
        {flashDealProducts.length > 0 && (
          <View style={styles.dealSection}>
            <View style={styles.dealHeader}>
              <View style={styles.dealTitleRow}>
                <AppIcon name="flash" size={18} color={colors.gold[400]} />
                <Text style={styles.dealTitle}>Limited Flash Deals</Text>
              </View>
              <View style={styles.dealTag}>
                <Text style={styles.dealTagText}>SAVE UP TO 25%</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dealScroll}
            >
              {flashDealProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onPress={onNavigateToProduct}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  isWishlisted={isWishlisted(prod.id)}
                  isAdding={addingId === prod.id}
                  cardWidth={DEAL_CARD_WIDTH}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Featured Pakistani Treasures</Text>
              <Text style={styles.sectionSub}>
                Handpicked for purity, authenticity, and premium quality
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigateToCatalog()}
              accessibilityRole="button"
              accessibilityLabel="See all featured products"
            >
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {(data?.featuredProducts || []).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={onNavigateToProduct}
                onAddToCart={handleAddToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={isWishlisted(product.id)}
                isAdding={addingId === product.id}
                cardWidth={DEFAULT_CARD_WIDTH}
              />
            ))}
          </View>
        </View>

        {/* Verified Sellers Spotlight */}
        {sellers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Verified Artisans & Sellers</Text>
                <Text style={styles.sectionSub}>Trusted local heritage makers across Pakistan</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sellersScroll}
            >
              {sellers.map((seller) => {
                const sName = safeString(seller.storeName || seller.ownerName, 'Artisan Seller');
                return (
                  <View key={seller.id} style={styles.sellerCard}>
                    <View style={styles.sellerAvatar}>
                      <Text style={styles.sellerAvatarText}>
                        {getInitials(sName)}
                      </Text>
                    </View>
                    <Text style={styles.sellerStoreName} numberOfLines={1}>
                      {sName}
                    </Text>
                    <View style={styles.sellerLocationRow}>
                      <AppIcon name="location" size={12} color="#718077" />
                      <Text style={styles.sellerLocationText}>
                        {safeString(seller.city, 'Pakistan')}
                      </Text>
                    </View>
                    <View style={styles.sellerRating}>
                      <AppIcon name="shield" size={12} color={colors.forest[700]} />
                      <Text style={styles.sellerRatingText}>
                        {seller.rating ? `${formatRating(seller.rating, '5.0')} Verified` : 'Verified Artisan'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Pakistani Courier & Payment Trust Strip */}
        <View style={styles.trustCard}>
          <Text style={styles.trustHeading}>Pakistan's Trusted Artisanal Network</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <View style={styles.trustIconBg}>
                <AppIcon name="delivery" size={20} color={colors.forest[800]} />
              </View>
              <Text style={styles.trustTitle}>TCS & Leopards</Text>
              <Text style={styles.trustDesc}>Nationwide courier tracking</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={styles.trustIconBg}>
                <AppIcon name="cash" size={20} color={colors.forest[800]} />
              </View>
              <Text style={styles.trustTitle}>COD & Raast</Text>
              <Text style={styles.trustDesc}>JazzCash & EasyPaisa</Text>
            </View>
            <View style={styles.trustItem}>
              <View style={styles.trustIconBg}>
                <AppIcon name="shield" size={20} color={colors.forest[800]} />
              </View>
              <Text style={styles.trustTitle}>100% Authentic</Text>
              <Text style={styles.trustDesc}>Artisan verified quality</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8f5ee',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.forest[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.forest[800],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold[500],
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.gold[400],
    letterSpacing: 0.8,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold[500],
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.gold[500],
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.forest[900],
  },
  cartBadgeText: {
    color: '#14291f',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2dbc9',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchPlaceholder: {
    fontSize: 13,
    color: '#718077',
    flex: 1,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.forest[800],
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.forest[700],
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 163, 75, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: colors.gold[400],
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 25,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#d6e2db',
    lineHeight: 18,
    marginBottom: 14,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold[500],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9,
  },
  heroBtnText: {
    color: '#14291f',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14291f',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#718077',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.forest[700],
  },
  categoryScroll: {
    gap: 10,
    paddingRight: 16,
  },
  categoryCard: {
    width: 92,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e8e2d4',
  },
  categoryIcon: {
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14291f',
    textAlign: 'center',
    height: 28,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 10,
    color: colors.forest[700],
    fontWeight: '600',
  },
  dealSection: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e8e2d4',
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14291f',
  },
  dealTag: {
    backgroundColor: '#fbf4eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eed8c2',
  },
  dealTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b84218',
  },
  dealScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sellersScroll: {
    gap: 12,
    paddingRight: 16,
  },
  sellerCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e2d4',
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d6ebd9',
  },
  sellerAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.forest[800],
  },
  sellerStoreName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
    textAlign: 'center',
    marginBottom: 4,
  },
  sellerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 6,
  },
  sellerLocationText: {
    fontSize: 10,
    color: '#718077',
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#edf6ee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sellerRatingText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.forest[800],
  },
  trustCard: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e2d4',
  },
  trustHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14291f',
    textAlign: 'center',
    marginBottom: 14,
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f6f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#d7e6d9',
  },
  trustTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 2,
    textAlign: 'center',
  },
  trustDesc: {
    fontSize: 9,
    color: '#718077',
    textAlign: 'center',
  },
});
