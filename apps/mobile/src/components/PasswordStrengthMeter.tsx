import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors } from '../theme/colors';

interface PasswordStrengthMeterProps {
  password: string;
}

export const getPasswordCriteria = (pwd: string) => ({
  hasMinLength: pwd.length >= 8,
  hasUpper: /[A-Z]/.test(pwd),
  hasLower: /[a-z]/.test(pwd),
  hasNumber: /[0-9]/.test(pwd),
  hasSpecial: /[@$!%*?&^#()_\-+=<>.,:;]/.test(pwd),
});

export const getPasswordStrength = (
  pwd: string,
): { label: string; level: number; color: string } => {
  if (!pwd) return { label: 'None', level: 0, color: colors.linen[400] };
  const c = getPasswordCriteria(pwd);
  const score = [c.hasMinLength, c.hasUpper, c.hasLower, c.hasNumber, c.hasSpecial].filter(
    Boolean,
  ).length;

  if (score <= 2) return { label: 'Weak', level: 1, color: colors.status.errorLight };
  if (score === 3) return { label: 'Fair', level: 2, color: colors.status.warning };
  if (score === 4) return { label: 'Good', level: 3, color: colors.status.info };
  return { label: 'Strong', level: 4, color: colors.status.success };
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const criteria = getPasswordCriteria(password);
  const strength = getPasswordStrength(password);

  return (
    <View style={styles.container} accessibilityLabel={`Password strength: ${strength.label}`}>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barProgress,
            {
              width: `${(strength.level / 4) * 100}%`,
              backgroundColor: strength.color,
            },
          ]}
        />
      </View>

      <Text style={[styles.strengthLabel, { color: strength.color }]}>
        Strength: {strength.label}
      </Text>

      <View style={styles.checklist}>
        <Text style={[styles.checkItem, criteria.hasMinLength ? styles.checkItemMet : undefined]}>
          {criteria.hasMinLength ? '✓' : '○'} At least 8 characters
        </Text>
        <Text style={[styles.checkItem, criteria.hasUpper ? styles.checkItemMet : undefined]}>
          {criteria.hasUpper ? '✓' : '○'} At least 1 uppercase letter (A-Z)
        </Text>
        <Text style={[styles.checkItem, criteria.hasLower ? styles.checkItemMet : undefined]}>
          {criteria.hasLower ? '✓' : '○'} At least 1 lowercase letter (a-z)
        </Text>
        <Text style={[styles.checkItem, criteria.hasNumber ? styles.checkItemMet : undefined]}>
          {criteria.hasNumber ? '✓' : '○'} At least 1 number (0-9)
        </Text>
        <Text style={[styles.checkItem, criteria.hasSpecial ? styles.checkItemMet : undefined]}>
          {criteria.hasSpecial ? '✓' : '○'} At least 1 special character {'(@$!%*?&^#()_-+=<>.,:;)'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.linen[300],
    borderWidth: 1,
    borderColor: colors.linen[400],
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
    marginBottom: 8,
  },
  barBackground: {
    height: 5,
    backgroundColor: colors.linen[500],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barProgress: {
    height: 5,
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  checklist: {
    gap: 4,
  },
  checkItem: {
    fontSize: 11,
    color: colors.text.muted,
  },
  checkItemMet: {
    color: colors.status.success,
    fontWeight: '600',
  },
});
