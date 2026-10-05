import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { AppIcon } from './AppIcon';

interface HeaderProps {
  onBack?: () => void;
  backLabel?: string;
  title?: string;
  showBrand?: boolean;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  backLabel,
  title,
  showBrand = true,
  rightElement,
}) => {
  return (
    <View style={styles.headerWrapper}>
      <View style={styles.headerContent}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel || 'Back'}
            activeOpacity={0.7}
          >
            <AppIcon name="back" size={20} color={colors.gold[400]} />
            {backLabel ? <Text style={styles.backButtonText}>{backLabel}</Text> : null}
          </TouchableOpacity>
        ) : showBrand ? (
          <View style={styles.brandContainer}>
            <View style={styles.brandDot} />
            <Text style={styles.brandTitle}>ToBeTake</Text>
          </View>
        ) : title ? (
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View />
        )}

        {title && onBack ? (
          <Text style={styles.centerTitleText} numberOfLines={1}>
            {title}
          </Text>
        ) : null}

        <View style={styles.rightContainer}>
          {rightElement || <View style={{ width: 24 }} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: colors.forest[900],
    borderBottomWidth: 1,
    borderBottomColor: colors.forest[800],
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  brandContainer: {
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
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  centerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    position: 'absolute',
    left: 60,
    right: 60,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 10,
    minHeight: 40,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold[400],
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 32,
  },
});
