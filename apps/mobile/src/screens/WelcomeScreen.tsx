import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { Button } from '../components/Button';
import { Header } from '../components/Header';

interface WelcomeScreenProps {
  onNavigateToSignIn: () => void;
  onNavigateToRegister: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToSignIn,
  onNavigateToRegister,
}) => {
  return (
    <View style={styles.safeArea}>
      {/* Brand Header Bar with Safe-Area Inset Handling */}
      <Header
        showBrand
        rightElement={
          <View style={styles.buyerBadge}>
            <Text style={styles.buyerBadgeText}>Customer App</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.pillBadge}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>Your Customer Marketplace</Text>
          </View>

          <Text style={styles.heroTitle}>Welcome to To Be Take</Text>
          <Text style={styles.heroSubtitle}>
            Discover products, shop from verified sellers, and manage your orders.
          </Text>
        </View>

        {/* Action Card */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>Shop & Discover</Text>
          <Text style={styles.cardTitle}>Start Your Shopping Experience</Text>
          <Text style={styles.cardDescription}>
            Sign in to access your saved items and track orders, or create a new customer account in
            seconds.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <View style={styles.checkBubble}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.featureText}>Discover verified stores & quality products</Text>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.checkBubble}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.featureText}>Fast, safe & secure checkout</Text>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.checkBubble}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
              <Text style={styles.featureText}>Real-time order tracking & purchase history</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              title="Sign In"
              onPress={onNavigateToSignIn}
              variant="primary"
              accessibilityLabel="Sign In to your customer account"
              accessibilityHint="Navigates to the customer sign in screen"
            />

            <Button
              title="Create Account"
              onPress={onNavigateToRegister}
              variant="secondary"
              accessibilityLabel="Create a new customer account"
              accessibilityHint="Navigates to the customer registration form"
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} To Be Take • Marketplace Platform
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.linen[200],
  },
  header: {
    backgroundColor: colors.forest[800],
    borderBottomWidth: 1,
    borderBottomColor: colors.forest[700],
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  brandRow: {
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
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: -0.5,
  },
  buyerBadge: {
    backgroundColor: colors.forest[700],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.forest[600],
  },
  buyerBadgeText: {
    color: colors.gold[400],
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.linen[300],
    borderColor: colors.linen[400],
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.forest[800],
    marginRight: 6,
  },
  pillText: {
    color: colors.forest[800],
    fontSize: 13,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: colors.forest[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  featureList: {
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: colors.forest[600],
    fontSize: 13,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 19,
  },
  buttonGroup: {
    gap: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.linen[400],
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.muted,
  },
});
