import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { fontSize, borderRadius } from '../../theme/spacing';

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#fef3c7', text: '#92400e' },
  Confirmed: { bg: '#dbeafe', text: '#1e40af' },
  Preparing: { bg: '#e0e7ff', text: '#3730a3' },
  Ready: { bg: '#d1fae5', text: '#065f46' },
  Served: { bg: '#cffafe', text: '#155e75' },
  Completed: { bg: '#dcfce7', text: '#166534' },
  Cancelled: { bg: '#fee2e2', text: '#991b1b' },
  Sent: { bg: '#fef3c7', text: '#92400e' },
  Acknowledged: { bg: '#dbeafe', text: '#1e40af' },
};

export default function StatusBadge({ status }: { status: string }) {
  const color = statusColors[status] ?? { bg: colors.gray[100], text: colors.gray[600] };
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  text: { fontSize: fontSize.xs, fontWeight: '600' },
});
