import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerProductDetail, CustomerReviewItem } from '@tobetake/shared-types';
import { getCustomerProductDetail, submitCustomerReview } from '../services/api';
import { useCustomerCart } from '../context/CustomerCartContext';
import { useAuth } from '../context/AuthContext';
import { AppIcon } from '../components/AppIcon';

interface ProductDetailScreenProps {
  productId: string;
  onNavigateBack: () => void;
  onNavigateToCart: () => void;
  onNavigateToCheckout?: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onNavigateBack,
  onNavigateToCart,
}) => {
  const { isAuthenticated } = useAuth();
  const { addToCart, toggleWishlist, isWishlisted, cartCount } = useCustomerCart();
  const [product, setProduct] = useState<CustomerProductDetail | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'delivery' | 'reviews'>('desc');

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCustomerProductDetail(productId);
      setProduct(data);
    } catch (err) {
      console.error('Failed to load product detail:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    await addToCart(product.id, quantity);
    setIsAdding(false);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsAdding(true);
    await addToCart(product.id, quantity);
    setIsAdding(false);
    onNavigateToCart();
  };

  const handleSubmitReview = async () => {
    if (!product) return;
    if (!reviewComment.trim()) {
      Alert.alert('Review Required', 'Please enter your review feedback.');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitCustomerReview({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle.trim() || undefined,
        comment: reviewComment.trim(),
      });
      setShowReviewModal(false);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      Alert.alert('Thank you!', 'Your review has been submitted for moderation.');
      loadProduct();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Loading artisanal product details...</Text>
      </View>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImageIndex] || null;

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={onNavigateBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <AppIcon name="back" size={20} color={colors.forest[900]} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {product.categoryName || 'Product Detail'}
        </Text>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => toggleWishlist(product.id)}
            accessibilityRole="button"
            accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <AppIcon
              name={wishlisted ? 'wishlist-fill' : 'wishlist'}
              size={20}
              color={wishlisted ? '#dc2626' : colors.forest[900]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={onNavigateToCart}
            accessibilityRole="button"
            accessibilityLabel="Shopping cart"
          >
            <AppIcon name="cart-outline" size={20} color={colors.forest[900]} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Gallery Image */}
        <View style={styles.imageGallery}>
          {currentImage ? (
            <Image source={{ uri: currentImage }} style={styles.mainImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImage}>
              <AppIcon name="leaf" size={48} color={colors.forest[400]} />
            </View>
          )}

          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>
                -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail Selector */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbScroll}
          >
            {images.map((img: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={[styles.thumbWrapper, selectedImageIndex === idx && styles.activeThumb]}
                onPress={() => setSelectedImageIndex(idx)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: img }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Basic Info */}
        <View style={styles.infoCard}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {product.categoryName?.toUpperCase() || 'MARKETPLACE'}
              </Text>
            </View>
            <View style={[styles.stockBadge, product.inStock ? styles.inStock : styles.outOfStock]}>
              <Text style={styles.stockBadgeText}>
                {product.inStock ? '● In Stock' : '● Sold Out'}
              </Text>
            </View>
          </View>

          <Text style={styles.productTitle}>{product.name}</Text>

          <View style={styles.ratingSection}>
            <AppIcon name="star" size={15} color={colors.gold[500]} />
            <Text style={styles.stars}>
              {product.rating ? product.rating.toFixed(1) : '4.9'}
            </Text>
            <Text style={styles.reviewsCount}>
              ({product.reviewCount || 14} customer reviews)
            </Text>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>Rs. {product.price.toLocaleString('en-PK')}</Text>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <Text style={styles.comparePrice}>
                Rs. {product.compareAtPrice.toLocaleString('en-PK')}
              </Text>
            )}
          </View>
        </View>

        {/* Quantity Stepper */}
        {product.inStock && (
          <View style={styles.quantityCard}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <AppIcon name="minus" size={16} color={colors.forest[900]} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity(Math.min(product.stockQuantity || 10, quantity + 1))}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <AppIcon name="plus" size={16} color={colors.forest[900]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Verified Seller Card */}
        {product.seller && (
          <View style={styles.sellerCard}>
            <View style={styles.sellerHeader}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>
                  {product.seller.storeName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerDetails}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerStoreName}>{product.seller.storeName}</Text>
                  <View style={styles.verifiedBadge}>
                    <AppIcon name="shield" size={12} color={colors.forest[700]} />
                    <Text style={styles.verifiedBadgeText}>Verified Artisan</Text>
                  </View>
                </View>
                <View style={styles.sellerLocationRow}>
                  <AppIcon name="location" size={12} color="#718077" />
                  <Text style={styles.sellerLocationText}>
                    {product.seller.city || 'Pakistan'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Tabbed Info */}
        <View style={styles.tabsCard}>
          <View style={styles.tabsHeader}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'desc' && styles.activeTabBtn]}
              onPress={() => setActiveTab('desc')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'desc' && styles.activeTabText]}>
                Description
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'specs' && styles.activeTabBtn]}
              onPress={() => setActiveTab('specs')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'specs' && styles.activeTabText]}>
                Specs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'delivery' && styles.activeTabBtn]}
              onPress={() => setActiveTab('delivery')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'delivery' && styles.activeTabText]}>
                Delivery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'reviews' && styles.activeTabBtn]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'reviews' && styles.activeTabText]}>
                Reviews ({product.reviews?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabBody}>
            {activeTab === 'desc' && (
              <Text style={styles.descText}>
                {product.description ||
                  'Crafted with pride and traditional mastery, representing the finest pure Pakistani craftsmanship. Carefully packaged for safe nationwide delivery.'}
              </Text>
            )}

            {activeTab === 'specs' && (
              <View style={styles.specsList}>
                {product.specifications ? (
                  Object.entries(product.specifications).map(([key, val]) => (
                    <View key={key} style={styles.specRow}>
                      <Text style={styles.specKey}>{key}</Text>
                      <Text style={styles.specVal}>{String(val)}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Origin</Text>
                    <Text style={styles.specVal}>Pakistan (Artisanal Verified)</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'delivery' && (
              <View style={styles.deliveryContent}>
                <View style={styles.deliveryItem}>
                  <View style={styles.deliveryIconBg}>
                    <AppIcon name="delivery" size={20} color={colors.forest[800]} />
                  </View>
                  <View style={styles.deliveryText}>
                    <Text style={styles.deliveryTitle}>TCS & Leopards Courier</Text>
                    <Text style={styles.deliverySub}>Standard delivery in 2-4 business days</Text>
                  </View>
                </View>

                <View style={styles.deliveryItem}>
                  <View style={styles.deliveryIconBg}>
                    <AppIcon name="cash" size={20} color={colors.forest[800]} />
                  </View>
                  <View style={styles.deliveryText}>
                    <Text style={styles.deliveryTitle}>COD & Digital Payments</Text>
                    <Text style={styles.deliverySub}>COD, JazzCash, EasyPaisa & Raast</Text>
                  </View>
                </View>

                <View style={styles.deliveryItem}>
                  <View style={styles.deliveryIconBg}>
                    <AppIcon name="refresh" size={20} color={colors.forest[800]} />
                  </View>
                  <View style={styles.deliveryText}>
                    <Text style={styles.deliveryTitle}>7-Day Replacement Policy</Text>
                    <Text style={styles.deliverySub}>Full support for damaged or incorrect goods</Text>
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={styles.reviewsList}>
                <TouchableOpacity
                  style={styles.writeReviewBtn}
                  onPress={() => {
                    if (!isAuthenticated) {
                      Alert.alert('Sign In Required', 'Please sign in to write a verified review.');
                      return;
                    }
                    setShowReviewModal(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Write a review"
                >
                  <Text style={styles.writeReviewText}>+ Write a Review</Text>
                </TouchableOpacity>

                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev: CustomerReviewItem) => (
                    <View key={rev.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>{rev.customerName}</Text>
                        <View style={styles.reviewStarRow}>
                          <AppIcon name="star" size={13} color={colors.gold[500]} />
                          <Text style={styles.reviewStars}>{rev.rating}/5</Text>
                        </View>
                      </View>
                      {rev.isVerifiedPurchase && (
                        <View style={styles.verifiedTag}>
                          <AppIcon name="check" size={11} color={colors.forest[700]} />
                          <Text style={styles.verifiedTagText}>Verified Purchase</Text>
                        </View>
                      )}
                      <Text style={styles.reviewComment}>{rev.comment}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noReviewsText}>No reviews yet. Be the first to leave one!</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addCartBtn, !product.inStock && styles.disabledBtn]}
          onPress={handleAddToCart}
          disabled={!product.inStock || isAdding}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isAdding ? 'Adding to cart' : 'Add to cart'}
        >
          <Text style={styles.addCartText}>{isAdding ? 'Adding...' : 'Add to Cart'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buyNowBtn, !product.inStock && styles.disabledBtn]}
          onPress={handleBuyNow}
          disabled={!product.inStock || isAdding}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Buy now"
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* Write Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            <Text style={styles.modalSub}>{product.name}</Text>

            <Text style={styles.inputLabel}>Rating</Text>
            <View style={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewRating(star)}
                  style={{ padding: 4 }}
                >
                  <AppIcon
                    name={reviewRating >= star ? 'star' : 'star-outline'}
                    size={28}
                    color={colors.gold[500]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Title (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Exceptional natural quality!"
              value={reviewTitle}
              onChangeText={setReviewTitle}
            />

            <Text style={styles.inputLabel}>Your Feedback</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Share your experience with this authentic product..."
              multiline
              numberOfLines={4}
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitReview}
                disabled={submittingReview}
              >
                <Text style={styles.modalSubmitText}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.forest[800],
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3ece0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#14291f',
    maxWidth: 180,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: colors.gold[600],
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageGallery: {
    width: '100%',
    height: 280,
    backgroundColor: '#ede6d8',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#b84218',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  thumbScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  thumbWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  activeThumb: {
    borderColor: colors.forest[800],
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: colors.forest[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.forest[800],
    letterSpacing: 0.5,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inStock: {
    backgroundColor: '#e6f4ea',
  },
  outOfStock: {
    backgroundColor: '#fce8e6',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#14291f',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 8,
    lineHeight: 26,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
  },
  stars: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
  },
  reviewsCount: {
    fontSize: 12,
    color: '#718077',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.forest[900],
  },
  comparePrice: {
    fontSize: 14,
    color: '#718077',
    textDecorationLine: 'line-through',
  },
  quantityCard: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2dbc9',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14291f',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    borderRadius: 8,
    backgroundColor: '#f8f5ee',
  },
  stepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14291f',
    minWidth: 28,
    textAlign: 'center',
  },
  sellerCard: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2dbc9',
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.forest[800],
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sellerStoreName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14291f',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#edf6ee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.forest[800],
  },
  sellerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerLocationText: {
    fontSize: 12,
    color: '#718077',
  },
  tabsCard: {
    backgroundColor: '#ffffff',
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2dbc9',
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: colors.forest[800],
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718077',
  },
  activeTabText: {
    color: colors.forest[800],
    fontWeight: '700',
  },
  tabBody: {
    padding: 16,
  },
  descText: {
    fontSize: 14,
    color: '#344e41',
    lineHeight: 22,
  },
  specsList: {
    gap: 10,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1ebd8',
  },
  specKey: {
    fontSize: 13,
    color: '#718077',
    fontWeight: '500',
  },
  specVal: {
    fontSize: 13,
    color: '#14291f',
    fontWeight: '600',
  },
  deliveryContent: {
    gap: 14,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deliveryIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f6f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryText: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
  },
  deliverySub: {
    fontSize: 11,
    color: '#718077',
    marginTop: 2,
  },
  reviewsList: {
    gap: 12,
  },
  writeReviewBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.forest[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  writeReviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.forest[800],
  },
  reviewCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f5ee',
    borderWidth: 1,
    borderColor: '#e8e2d4',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
  },
  reviewStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reviewStars: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    color: colors.forest[700],
    fontWeight: '600',
  },
  reviewComment: {
    fontSize: 13,
    color: '#344e41',
    lineHeight: 18,
  },
  noReviewsText: {
    fontSize: 13,
    color: '#718077',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2dbc9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  addCartBtn: {
    flex: 1,
    backgroundColor: '#f3ece0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  addCartText: {
    color: colors.forest[900],
    fontSize: 14,
    fontWeight: '700',
  },
  buyNowBtn: {
    flex: 1,
    backgroundColor: colors.forest[800],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyNowText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledBtn: {
    backgroundColor: '#d6cfc2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14291f',
  },
  modalSub: {
    fontSize: 12,
    color: '#718077',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 6,
  },
  ratingPicker: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f8f5ee',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#14291f',
    marginBottom: 14,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f5ee',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718077',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.forest[800],
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
