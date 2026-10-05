import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '../theme/colors';
import { AppIcon } from './AppIcon';

interface AlertBannerProps {
  message: string | null;
  type?: 'error' | 'success' | 'warning' | 'info';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message, type = 'error' }) => {
  if (!message) return null;

  const getContainerStyle = () => {
    switch (type) {
      case 'success':
        return styles.successBanner;
      case 'warning':
        return styles.warningBanner;
      case 'info':
        return styles.infoBanner;
      case 'error':
      default:
        return styles.errorBanner;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'success':
        return styles.successText;
      case 'warning':
        return styles.warningText;
      case 'info':
        return styles.infoText;
      case 'error':
      default:
        return styles.errorText;
    }
  };

  const getIconProps = (): { name: any; color: string } => {
    switch (type) {
      case 'success':
        return { name: 'check', color: colors.status.success };
      case 'warning':
        return { name: 'shield', color: '#b45309' };
      case 'info':
        return { name: 'help', color: '#1d4ed8' };
      case 'error':
      default:
        return { name: 'close', color: colors.status.error };
    }
  };

  const iconProps = getIconProps();

  return (
    <View
      style={[styles.baseBanner, getContainerStyle()]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.contentRow}>
        <AppIcon name={iconProps.name} size={16} color={iconProps.color} />
        <Text style={[styles.baseText, getTextStyle()]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  baseBanner: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  baseText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
  errorBanner: {
    backgroundColor: colors.status.errorBg,
    borderColor: colors.status.errorBorder,
  },
  errorText: {
    color: colors.status.errorText,
  },
  successBanner: {
    backgroundColor: colors.status.successBg,
    borderColor: colors.status.successBorder,
  },
  successText: {
    color: colors.status.successText,
  },
  warningBanner: {
    backgroundColor: colors.status.warningBg,
    borderColor: colors.status.warningBorder,
  },
  warningText: {
    color: '#92400e',
  },
  infoBanner: {
    backgroundColor: colors.status.infoBg,
    borderColor: colors.status.infoBorder,
  },
  infoText: {
    color: '#1e40af',
  },
});
