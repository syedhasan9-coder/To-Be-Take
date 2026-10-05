import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

interface ProductSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({
  count = 4,
  style,
}) => {
  return (
    <View style={[styles.grid, style]}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.imagePlaceholder} />
          <View style={styles.body}>
            <View style={styles.tagLine} />
            <View style={styles.titleLine1} />
            <View style={styles.titleLine2} />
            <View style={styles.priceLine} />
          </View>
          <View style={styles.btnPlaceholder} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e2d4',
    paddingBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 136,
    backgroundColor: '#ebe5d8',
  },
  body: {
    padding: 10,
  },
  tagLine: {
    width: '40%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ede7da',
    marginBottom: 8,
  },
  titleLine1: {
    width: '90%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#e6dfd1',
    marginBottom: 6,
  },
  titleLine2: {
    width: '65%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#e6dfd1',
    marginBottom: 10,
  },
  priceLine: {
    width: '50%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#ded7c7',
  },
  btnPlaceholder: {
    marginHorizontal: 10,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e2dbc9',
  },
});
