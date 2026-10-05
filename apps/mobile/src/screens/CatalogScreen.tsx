import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerStorefrontProduct, CategoryItem } from '@tobetake/shared-types';
import { getCustomerProducts, getCustomerStorefront } from '../services/api';
import { useCustomerCart } from '../context/CustomerCartContext';
import { AppIcon } from '../components/AppIcon';
import { ProductCard, DEFAULT_CARD_WIDTH } from '../components/ProductCard';
import { ProductSkeleton } from '../components/ProductSkeleton';
import { CategoryVisualIcon } from '../components/CategoryVisual';

const { width } = Dimensions.get('window');

interface CatalogScreenProps {
  initialCategory?: string;
  initialSearch?: string;
  onNavigateToProduct: (productId: string) => void;
  onNavigateBack?: () => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  initialCategory,
  initialSearch = '',
  onNavigateToProduct,
}) => {
  const { addToCart, toggleWishlist, isWishlisted } = useCustomerCart();
  const [products, setProducts] = useState<CustomerStorefrontProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Synchronize when parent navigation props change
  useEffect(() => {
    if (initialCategory !== undefined) {
      setSelectedCategory(initialCategory || 'all');
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Load categories
  useEffect(() => {
    getCustomerStorefront()
      .then((res) => {
        if (res.categories) setCategories(res.categories as any);
      })
      .catch((err) => console.warn('Failed to load categories:', err));
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCustomerProducts({
        search: searchQuery.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        inStockOnly: inStockOnly ? true : undefined,
        sortBy,
        limit: 50,
      });
      const list = res.products || res.items || [];
      setProducts(list);
    } catch (err) {
      console.error('Failed to load catalog products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, inStockOnly, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const handleAddToCart = async (product: CustomerStorefrontProduct) => {
    setAddingId(product.id);
    await addToCart(product.id, 1);
    setAddingId(null);
  };

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setInStockOnly(false);
    setSortBy('newest');
  };

  const categoryList: Array<{ id: string | number; name: string; slug: string }> = [
    { id: 'all', name: 'All Treasures', slug: 'all' },
    ...categories,
  ];

  return (
    <View style={styles.container}>
      {/* Top Search & Filter Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Explore Marketplace</Text>
          <Text style={styles.headerCountBadge}>
            {loading ? '...' : `${products.length} Items`}
          </Text>
        </View>

        <View style={styles.searchBox}>
          <AppIcon name="search" size={18} color="#718077" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dry fruits, pottery, oils, tech..."
            placeholderTextColor="#8c9990"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            accessibilityLabel="Search catalog"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <AppIcon name="close" size={18} color="#718077" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Category Carousel */}
      <View style={styles.categoryBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.categoryPills}
          renderItem={({ item }) => {
            const isSelected =
              selectedCategory === item.slug ||
              (item.slug === 'all' && selectedCategory === 'all') ||
              selectedCategory === String(item.id);
            return (
              <TouchableOpacity
                style={[styles.pill, isSelected && styles.activePill]}
                onPress={() => setSelectedCategory(item.slug || String(item.id))}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.name}`}
              >
                <CategoryVisualIcon
                  slugOrName={item.slug}
                  size={14}
                  containerSize={24}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.pillText, isSelected && styles.activePillText]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Filter Chips Bar (In Stock, Price Sort, Rating) */}
      <View style={styles.secondaryFilters}>
        <TouchableOpacity
          style={[styles.chip, inStockOnly && styles.activeChip]}
          onPress={() => setInStockOnly(!inStockOnly)}
          activeOpacity={0.75}
        >
          {inStockOnly && <AppIcon name="check" size={12} color="#ffffff" style={{ marginRight: 4 }} />}
          <Text style={[styles.chipText, inStockOnly && styles.activeChipText]}>
            In Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, sortBy === 'price_asc' && styles.activeChip]}
          onPress={() => setSortBy(sortBy === 'price_asc' ? 'newest' : 'price_asc')}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, sortBy === 'price_asc' && styles.activeChipText]}>
            Price: Low ↑
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, sortBy === 'price_desc' && styles.activeChip]}
          onPress={() => setSortBy(sortBy === 'price_desc' ? 'newest' : 'price_desc')}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, sortBy === 'price_desc' && styles.activeChipText]}>
            Price: High ↓
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, sortBy === 'rating' && styles.activeChip]}
          onPress={() => setSortBy(sortBy === 'rating' ? 'newest' : 'rating')}
          activeOpacity={0.75}
        >
          <AppIcon
            name="star"
            size={12}
            color={sortBy === 'rating' ? '#ffffff' : colors.gold[500]}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.chipText, sortBy === 'rating' && styles.activeChipText]}>
            Top Rated
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Product Grid / States */}
      {loading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          <ProductSkeleton count={6} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIconBg}>
            <AppIcon name="search" size={32} color={colors.forest[700]} />
          </View>
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `We couldn't find any products matching "${searchQuery}".`
              : 'No items found in this category with current filters.'}
          </Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearFilters}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reset all filters"
          >
            <Text style={styles.clearBtnText}>Reset Filters & View All</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.forest[800]]}
              tintColor={colors.forest[800]}
            />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={onNavigateToProduct}
              onAddToCart={handleAddToCart}
              onToggleWishlist={toggleWishlist}
              isWishlisted={isWishlisted(item.id)}
              isAdding={addingId === item.id}
              cardWidth={DEFAULT_CARD_WIDTH}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5ee',
  },
  header: {
    backgroundColor: colors.forest[900],
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.forest[800],
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  headerCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold[400],
    backgroundColor: 'rgba(212, 163, 75, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#14291f',
    paddingVertical: 0,
  },
  categoryBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e2d4',
    paddingVertical: 8,
  },
  categoryPills: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f6f3eb',
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  activePill: {
    backgroundColor: colors.forest[800],
    borderColor: colors.forest[800],
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344e41',
  },
  activePillText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  secondaryFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: '#f8f5ee',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeChip: {
    backgroundColor: colors.forest[800],
    borderColor: colors.forest[800],
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#495a50',
  },
  activeChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eaf2eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cde1cf',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    maxWidth: 260,
  },
  clearBtn: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
