import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  Ionicons,
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { colors } from '../theme/colors';

export type IconName =
  | 'home'
  | 'home-outline'
  | 'explore'
  | 'catalog'
  | 'search'
  | 'cart'
  | 'cart-outline'
  | 'wishlist'
  | 'wishlist-fill'
  | 'account'
  | 'account-outline'
  | 'orders'
  | 'notifications'
  | 'notifications-outline'
  | 'settings'
  | 'location'
  | 'filter'
  | 'sort'
  | 'back'
  | 'chevron-right'
  | 'close'
  | 'star'
  | 'star-outline'
  | 'check'
  | 'check-circle'
  | 'flash'
  | 'share'
  | 'lock'
  | 'card'
  | 'wallet'
  | 'delivery'
  | 'tracking'
  | 'shield'
  | 'leaf'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'refresh'
  | 'chat'
  | 'eye'
  | 'eye-off'
  | 'logout'
  | 'edit'
  | 'grid'
  | 'list'
  | 'info'
  | 'phone'
  | 'mail'
  | 'cash';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 20,
  color = colors.forest[800],
  style,
}) => {
  switch (name) {
    // Navigation
    case 'home':
      return <Ionicons name="home" size={size} color={color} style={style} />;
    case 'home-outline':
      return <Ionicons name="home-outline" size={size} color={color} style={style} />;
    case 'explore':
    case 'catalog':
      return <Ionicons name="compass-outline" size={size} color={color} style={style} />;
    case 'search':
      return <Ionicons name="search-outline" size={size} color={color} style={style} />;
    case 'cart':
      return <Ionicons name="bag-handle" size={size} color={color} style={style} />;
    case 'cart-outline':
      return <Ionicons name="bag-handle-outline" size={size} color={color} style={style} />;
    case 'wishlist':
      return <Ionicons name="heart-outline" size={size} color={color} style={style} />;
    case 'wishlist-fill':
      return <Ionicons name="heart" size={size} color={color || '#dc2626'} style={style} />;
    case 'account':
      return <Ionicons name="person" size={size} color={color} style={style} />;
    case 'account-outline':
      return <Ionicons name="person-outline" size={size} color={color} style={style} />;

    // Actions & Operations
    case 'orders':
      return <Feather name="package" size={size} color={color} style={style} />;
    case 'notifications':
      return <Ionicons name="notifications" size={size} color={color} style={style} />;
    case 'notifications-outline':
      return <Ionicons name="notifications-outline" size={size} color={color} style={style} />;
    case 'settings':
      return <Ionicons name="settings-outline" size={size} color={color} style={style} />;
    case 'location':
      return <Ionicons name="location-outline" size={size} color={color} style={style} />;
    case 'filter':
      return <Feather name="sliders" size={size} color={color} style={style} />;
    case 'sort':
      return <MaterialCommunityIcons name="swap-vertical" size={size} color={color} style={style} />;
    case 'back':
      return <Ionicons name="arrow-back" size={size} color={color} style={style} />;
    case 'chevron-right':
      return <Ionicons name="chevron-forward" size={size} color={color} style={style} />;
    case 'close':
      return <Ionicons name="close" size={size} color={color} style={style} />;
    case 'star':
      return <Ionicons name="star" size={size} color={color || colors.gold[500]} style={style} />;
    case 'star-outline':
      return <Ionicons name="star-outline" size={size} color={color || colors.gold[500]} style={style} />;
    case 'check':
      return <Ionicons name="checkmark" size={size} color={color} style={style} />;
    case 'check-circle':
      return <Ionicons name="checkmark-circle" size={size} color={color} style={style} />;
    case 'flash':
      return <Ionicons name="flash" size={size} color={color || colors.gold[500]} style={style} />;
    case 'share':
      return <Ionicons name="share-social-outline" size={size} color={color} style={style} />;
    case 'lock':
      return <Ionicons name="lock-closed-outline" size={size} color={color} style={style} />;
    case 'card':
      return <Ionicons name="card-outline" size={size} color={color} style={style} />;
    case 'wallet':
      return <Ionicons name="wallet-outline" size={size} color={color} style={style} />;
    case 'cash':
      return <MaterialCommunityIcons name="cash-multiple" size={size} color={color} style={style} />;
    case 'delivery':
      return <MaterialCommunityIcons name="truck-delivery-outline" size={size} color={color} style={style} />;
    case 'tracking':
      return <MaterialCommunityIcons name="map-marker-path" size={size} color={color} style={style} />;
    case 'shield':
      return <Ionicons name="shield-checkmark-outline" size={size} color={color} style={style} />;
    case 'leaf':
      return <Ionicons name="leaf-outline" size={size} color={color} style={style} />;
    case 'plus':
      return <Ionicons name="add" size={size} color={color} style={style} />;
    case 'minus':
      return <Ionicons name="remove" size={size} color={color} style={style} />;
    case 'trash':
      return <Ionicons name="trash-outline" size={size} color={color} style={style} />;
    case 'refresh':
      return <Ionicons name="refresh-outline" size={size} color={color} style={style} />;
    case 'chat':
      return <Ionicons name="chatbubble-ellipses-outline" size={size} color={color} style={style} />;
    case 'eye':
      return <Ionicons name="eye-outline" size={size} color={color} style={style} />;
    case 'eye-off':
      return <Ionicons name="eye-off-outline" size={size} color={color} style={style} />;
    case 'logout':
      return <Ionicons name="log-out-outline" size={size} color={color} style={style} />;
    case 'edit':
      return <Feather name="edit-2" size={size} color={color} style={style} />;
    case 'grid':
      return <Ionicons name="grid-outline" size={size} color={color} style={style} />;
    case 'list':
      return <Ionicons name="list-outline" size={size} color={color} style={style} />;
    case 'info':
      return <Ionicons name="information-circle-outline" size={size} color={color} style={style} />;
    case 'phone':
      return <Ionicons name="call-outline" size={size} color={color} style={style} />;
    case 'mail':
      return <Ionicons name="mail-outline" size={size} color={color} style={style} />;

    default:
      return <Ionicons name="ellipse-outline" size={size} color={color} style={style} />;
  }
};
