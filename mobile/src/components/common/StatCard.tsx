import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';

interface StatCardProps {
  title: string;
  value: string;
  color?: string;
}

export default function StatCard({ title, value, color = colors.primary }: StatCardProps) {
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 0.48, backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md,
    borderTopWidth: 3, elevation: 1, marginBottom: spacing.sm,
  },
  value: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  title: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});
