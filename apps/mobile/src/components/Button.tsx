import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  icon?: React.ReactNode;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  loadingText,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  icon,
  testID,
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondary;
      case 'outline':
        return styles.btnOutline;
      case 'danger':
        return styles.btnDanger;
      case 'primary':
      default:
        return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.btnSecondaryText;
      case 'outline':
        return styles.btnOutlineText;
      case 'danger':
        return styles.btnDangerText;
      case 'primary':
      default:
        return styles.btnPrimaryText;
    }
  };

  const getSpinnerColor = () => {
    switch (variant) {
      case 'outline':
        return colors.forest[800];
      case 'secondary':
        return colors.forest[800];
      default:
        return '#ffffff';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseButton,
        getButtonStyle(),
        disabled || loading ? styles.disabled : undefined,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
    >
      {loading ? (
        <View style={styles.contentRow}>
          <ActivityIndicator size="small" color={getSpinnerColor()} />
          <Text style={[getTextStyle(), styles.loadingTextMargin, textStyle]}>
            {loadingText || title}
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    minHeight: 50,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  loadingTextMargin: {
    marginLeft: 8,
  },
  btnPrimary: {
    backgroundColor: colors.forest[800],
    elevation: 2,
    shadowColor: colors.forest[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  btnSecondary: {
    backgroundColor: colors.linen[300],
    borderWidth: 1,
    borderColor: colors.linen[400],
  },
  btnSecondaryText: {
    color: colors.forest[800],
    fontSize: 16,
    fontWeight: '600',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.forest[800],
  },
  btnOutlineText: {
    color: colors.forest[800],
    fontSize: 16,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: colors.status.error,
  },
  btnDangerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
