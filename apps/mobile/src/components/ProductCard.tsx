import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerStorefrontProduct } from '@tobetake/shared-types';
import { AppIcon } from './AppIcon';
import { formatRs, formatRating, safeString } from '../utils/formatters';

const { width } = Dimensions.get('window');
export const DEFAULT_CARD_WIDTH = (width - 44) / 2;

interface ProductCardProps {
  product: CustomerStorefrontProduct;
  onPress: (productId: string) => void;
  onAddToCart: (product: CustomerStorefrontProduct) => void;
  onToggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
  isAdding?: boolean;
  cardWidth?: number;
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  isAdding = false,
  cardWidth = DEFAULT_CARD_WIDTH,
  style,
}) => {
  const img = product.images?.[0];
  const price = Number(product.price) || 0;
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const hasDiscount = Boolean(compareAtPrice && compareAtPrice > price);
  const discountPercent = hasDiscount && compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const isOutOfStock = Boolean(product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity <= 0);

  return (
    <View style={[styles.card, { width: cardWidth }, style]}>
      <TouchableOpacity
        onPress={() => onPress(product.id)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${product.name || 'Product'}, Rs. ${formatRs(price)}`}
      >
        <View style={styles.imageWrapper}>
          {img ? (
            <Image
              source={{ uri: img }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImage}>
              <AppIcon name="leaf" size={28} color={colors.forest[400]} />
            </View>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}

          {/* Out of Stock Overlay Badge */}
          {isOutOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}

          {/* Wishlist Button */}
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={() => onToggleWishlist(product.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <AppIcon
              name={isWishlisted ? 'wishlist-fill' : 'wishlist'}
              size={18}
              color={isWishlisted ? '#dc2626' : colors.forest[800]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.categoryTag} numberOfLines={1}>
            {safeString(product.categoryName, 'MARKETPLACE').toUpperCase()}
          </Text>

          <Text style={styles.title} numberOfLines={2}>
            {product.name || 'Pakistani Handcrafted Item'}
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <AppIcon name="star" size={13} color={colors.gold[500]} />
            <Text style={styles.ratingText}>
              {formatRating(product.rating, '4.8')}
            </Text>
            <Text style={styles.reviewCount}>({Number(product.reviewCount) || 8})</Text>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              Rs. {formatRs(price)}
            </Text>
            {hasDiscount && compareAtPrice !== null && (
              <Text style={styles.comparePrice}>
                Rs. {formatRs(compareAtPrice)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Add to Cart CTA */}
      <TouchableOpacity
        style={[styles.addBtn, isOutOfStock && styles.disabledBtn]}
        onPress={() => onAddToCart(product)}
        disabled={isOutOfStock || isAdding}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={isOutOfStock ? 'Out of stock' : 'Add to cart'}
      >
        <Text style={styles.addBtnText}>
          {isAdding ? 'Adding...' : isOutOfStock ? 'Sold Out' : '+ Add to Cart'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e2d4',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  imageWrapper: {
    width: '100%',
    height: 136,
    backgroundColor: '#f1ebe0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ebe4d5',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#b84218',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(20, 41, 31, 0.85)',
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardBody: {
    padding: 10,
  },
  categoryTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.forest[700],
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
    lineHeight: 18,
    height: 36,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14291f',
  },
  reviewCount: {
    fontSize: 10,
    color: colors.text.muted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.forest[900],
  },
  comparePrice: {
    fontSize: 11,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: colors.forest[800],
    marginHorizontal: 10,
    marginBottom: 10,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    backgroundColor: '#c4bdb0',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
