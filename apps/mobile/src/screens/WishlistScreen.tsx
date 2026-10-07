import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerWishlistItem } from '@tobetake/shared-types';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useAuth } from '../context/AuthContext';
import { AppIcon } from '../components/AppIcon';
import { formatRs } from '../utils/formatters';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

interface WishlistScreenProps {
  onNavigateToCatalog: () => void;
  onNavigateToProduct: (productId: string) => void;
  onNavigateToSignIn?: () => void;
}

export const WishlistScreen: React.FC<WishlistScreenProps> = ({
  onNavigateToCatalog,
  onNavigateToProduct,
  onNavigateToSignIn,
}) => {
  const { isAuthenticated } = useAuth();
  const { wishlist, toggleWishlist, addToCart } = useCustomerCart();

  if (!isAuthenticated) {
    return (
      <View style={styles.centerBox}>
        <View style={styles.emptyIconBg}>
          <AppIcon name="wishlist" size={36} color={colors.forest[800]} />
        </View>
        <Text style={styles.emptyTitle}>Save Your Favorite Treasures</Text>
        <Text style={styles.emptySub}>
          Please sign in to keep track of pure Pakistani artisanal items.
        </Text>
        {onNavigateToSignIn && (
          <TouchableOpacity
            style={[styles.actionBtn, { marginBottom: 10, width: '100%', maxWidth: 260 }]}
            onPress={onNavigateToSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign in to customer account"
          >
            <Text style={styles.actionBtnText}>Sign In to Account</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#f6f2e8', borderWidth: 1, borderColor: '#e2dbc9', width: '100%', maxWidth: 260 }]}
          onPress={onNavigateToCatalog}
          accessibilityRole="button"
          accessibilityLabel="Explore marketplace"
        >
          <Text style={[styles.actionBtnText, { color: colors.forest[900] }]}>Explore Marketplace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleMoveToCart = async (item: CustomerWishlistItem) => {
    const added = await addToCart(item.productId, 1);
    if (added) {
      await toggleWishlist(item.productId);
      Alert.alert('Moved to Cart', `${item.productName} has been moved to your shopping bag.`);
    }
  };

  if (wishlist.length === 0) {
    return (
      <View style={styles.centerBox}>
        <View style={styles.emptyIconBg}>
          <AppIcon name="wishlist" size={36} color={colors.forest[800]} />
        </View>
        <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
        <Text style={styles.emptySub}>
          Save handcrafted pottery, organic oils, and Himalayan salt lamps as you explore.
        </Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onNavigateToCatalog}
          accessibilityRole="button"
          accessibilityLabel="Explore products"
        >
          <Text style={styles.actionBtnText}>Explore Products →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>Saved Treasures ({wishlist.length})</Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => onNavigateToProduct(item.productId)} activeOpacity={0.8}>
              <View style={styles.imageWrapper}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={styles.noImage}>
                    <AppIcon name="leaf" size={28} color={colors.forest[400]} />
                  </View>
                )}

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => toggleWishlist(item.productId)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Remove from wishlist"
                >
                  <AppIcon name="close" size={14} color="#14291f" />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={styles.prodName} numberOfLines={2}>
                  {item.productName}
                </Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>Rs. {formatRs(item.price)}</Text>
                  {Boolean(item.compareAtPrice && item.compareAtPrice > item.price) && (
                    <Text style={styles.comparePrice}>
                      Rs. {formatRs(item.compareAtPrice)}
                    </Text>
                  )}
                </View>

                <View style={styles.stockRow}>
                  <Text style={[styles.stockDot, item.inStock ? styles.inStock : styles.outOfStock]}>
                    ● {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moveBtn, !item.inStock && styles.disabledBtn]}
              onPress={() => handleMoveToCart(item)}
              disabled={!item.inStock}
              accessibilityRole="button"
              accessibilityLabel="Move to cart"
            >
              <Text style={styles.moveBtnText}>Move to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f5ee',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f5ee',
    padding: 30,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#edf4ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cde0d0',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#718077',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    maxWidth: 260,
  },
  actionBtn: {
    backgroundColor: colors.forest[800],
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14291f',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e2d4',
    justifyContent: 'space-between',
  },
  imageWrapper: {
    width: '100%',
    height: 130,
    backgroundColor: '#ede6d8',
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
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 10,
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 4,
    lineHeight: 17,
    height: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.forest[800],
  },
  comparePrice: {
    fontSize: 11,
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  stockRow: {
    marginTop: 4,
  },
  stockDot: {
    fontSize: 11,
    fontWeight: '700',
  },
  inStock: {
    color: '#137333',
  },
  outOfStock: {
    color: '#dc2626',
  },
  moveBtn: {
    backgroundColor: colors.forest[800],
    paddingVertical: 9,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#dcd5c7',
  },
  moveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
