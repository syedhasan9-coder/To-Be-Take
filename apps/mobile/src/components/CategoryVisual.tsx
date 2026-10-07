import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface CategoryVisualConfig {
  iconComponent: (props: { size: number; color: string }) => React.ReactElement;
  bgTint: string;
  borderColor: string;
  iconColor: string;
}

export function getCategoryVisualConfig(slugOrName: string = ''): CategoryVisualConfig {
  const norm = (slugOrName || '').toString().toLowerCase();

  if (norm.includes('audio') || norm.includes('headphone')) {
    return {
      iconComponent: ({ size, color }) => <Ionicons name="headset-outline" size={size} color={color} />,
      bgTint: '#f0f4f8',
      borderColor: '#d0dbe5',
      iconColor: '#2b5278',
    };
  }

  if (norm.includes('electronic') || norm.includes('gadget') || norm.includes('tech')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="devices" size={size} color={color} />,
      bgTint: '#f1f5f9',
      borderColor: '#cbd5e1',
      iconColor: '#334155',
    };
  }

  if (norm.includes('smart') || norm.includes('wearable') || norm.includes('watch')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="watch-vibrate" size={size} color={color} />,
      bgTint: '#f8fafc',
      borderColor: '#e2e8f0',
      iconColor: '#0f172a',
    };
  }

  if (norm.includes('ceramic') || norm.includes('pottery') || norm.includes('tableware')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="palette-outline" size={size} color={color} />,
      bgTint: '#fbf4ec',
      borderColor: '#eed8c2',
      iconColor: '#a85d26',
    };
  }

  if (norm.includes('home') || norm.includes('living') || norm.includes('furniture')) {
    return {
      iconComponent: ({ size, color }) => <Feather name="home" size={size} color={color} />,
      bgTint: '#f4f7f4',
      borderColor: '#d7e2d7',
      iconColor: '#2d5a37',
    };
  }

  if (norm.includes('oil') || norm.includes('aromatherapy') || norm.includes('fragrance')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="oil" size={size} color={color} />,
      bgTint: '#fbf7eb',
      borderColor: '#eee2bd',
      iconColor: '#b48316',
    };
  }

  if (norm.includes('skincare') || norm.includes('serum') || norm.includes('lotion')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="lotion-plus-outline" size={size} color={color} />,
      bgTint: '#fdf4f5',
      borderColor: '#fad5d8',
      iconColor: '#9e3f53',
    };
  }

  if (norm.includes('beauty') || norm.includes('wellness') || norm.includes('spa')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="spa-outline" size={size} color={color} />,
      bgTint: '#f6f4fa',
      borderColor: '#dfd7eb',
      iconColor: '#634789',
    };
  }

  if (norm.includes('grocery') || norm.includes('food') || norm.includes('honey') || norm.includes('spice')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="basket-outline" size={size} color={color} />,
      bgTint: '#fbf8ee',
      borderColor: '#eee5c4',
      iconColor: '#8a6515',
    };
  }

  if (norm.includes('planter') || norm.includes('botanical') || norm.includes('plant')) {
    return {
      iconComponent: ({ size, color }) => <Ionicons name="leaf-outline" size={size} color={color} />,
      bgTint: '#edf6ee',
      borderColor: '#cce5ce',
      iconColor: '#1e682e',
    };
  }

  if (norm.includes('fashion') || norm.includes('apparel') || norm.includes('shawl') || norm.includes('clothing')) {
    return {
      iconComponent: ({ size, color }) => <MaterialCommunityIcons name="hanger" size={size} color={color} />,
      bgTint: '#f8f4f2',
      borderColor: '#e8dbd5',
      iconColor: '#7a4233',
    };
  }

  // Fallback / default
  return {
    iconComponent: ({ size, color }) => <Ionicons name="grid-outline" size={size} color={color} />,
    bgTint: '#f4f6f4',
    borderColor: '#dce4dc',
    iconColor: colors.forest[800],
  };
}

interface CategoryVisualIconProps {
  slugOrName?: string;
  size?: number;
  containerSize?: number;
  style?: ViewStyle;
}

export const CategoryVisualIcon: React.FC<CategoryVisualIconProps> = ({
  slugOrName = '',
  size = 22,
  containerSize = 44,
  style,
}) => {
  const config = getCategoryVisualConfig(slugOrName);

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: containerSize / 2,
          backgroundColor: config?.bgTint || '#f4f6f4',
          borderColor: config?.borderColor || '#dce4dc',
        },
        style,
      ]}
    >
      {typeof config?.iconComponent === 'function' ? (
        config.iconComponent({ size, color: config.iconColor || colors.forest[800] })
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
