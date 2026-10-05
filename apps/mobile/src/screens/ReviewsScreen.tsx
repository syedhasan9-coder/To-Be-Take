import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { CustomerReviewItem } from '@tobetake/shared-types';
import { getCustomerReviews } from '../services/api';
import { AppIcon } from '../components/AppIcon';

interface ReviewsScreenProps {
  onNavigateBack: () => void;
  onNavigateToProduct?: (productId: string) => void;
}

export const ReviewsScreen: React.FC<ReviewsScreenProps> = ({
  onNavigateBack,
  onNavigateToProduct,
}) => {
  const [reviews, setReviews] = useState<CustomerReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadReviews = useCallback(async () => {
    try {
      const data = await getCustomerReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.forest[800]} />
        <Text style={styles.loadingText}>Loading your verified reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onNavigateBack} activeOpacity={0.7}>
          <AppIcon name="back" size={18} color={colors.forest[900]} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>My Reviews ({reviews.length})</Text>
        <View style={{ width: 36 }} />
      </View>

      {reviews.length === 0 ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconCircle}>
            <AppIcon name="star" size={32} color={colors.gold[500]} />
          </View>
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptySub}>
            Share your feedback on delivered Pakistani artisanal products to help other shoppers.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadReviews();
          }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  style={{ flex: 1, marginRight: 8 }}
                  onPress={() => item.productId && onNavigateToProduct?.(item.productId)}
                >
                  <Text style={styles.productName}>{item.productName || 'Pakistani Artisanal Treasure'}</Text>
                </TouchableOpacity>
                <View style={styles.ratingBadge}>
                  <AppIcon name="star" size={12} color={colors.gold[500]} />
                  <Text style={styles.ratingText}>{item.rating}/5</Text>
                </View>
              </View>

              {item.isVerifiedPurchase && (
                <View style={styles.verifiedRow}>
                  <AppIcon name="check" size={12} color={colors.status.success} />
                  <Text style={styles.verifiedText}>Verified Purchase</Text>
                </View>
              )}

              {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
              <Text style={styles.comment}>{item.comment}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('en-PK', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
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
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f5ee',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.forest[800],
    fontWeight: '600',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2dbc9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14291f',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2dbc9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3ece0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14291f',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2dbc9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14291f',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef8eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#faecc8',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b37400',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  verifiedText: {
    fontSize: 10,
    color: '#137333',
    fontWeight: '700',
  },
  reviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14291f',
    marginBottom: 4,
  },
  comment: {
    fontSize: 12,
    color: '#2d3748',
    lineHeight: 17,
    marginBottom: 6,
  },
  date: {
    fontSize: 10,
    color: colors.text.secondary,
  },
});
