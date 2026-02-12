import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { menuApi } from '../../services/menuApi';
import { MenuItem, Category } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, fontSize, borderRadius } from '../../theme/spacing';

export default function MenuScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuApi.getCategories(),
  });

  const { data: itemData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['menuItems', selectedCategory],
    queryFn: () => menuApi.getItems(selectedCategory ? { categoryId: selectedCategory } : {}),
  });

  const categories = catData?.data?.data ?? [];
  const items = itemData?.data?.data?.items ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={[{ id: null, name: 'All' }, ...categories] as any[]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catChip, selectedCategory === item.id && styles.activeCat]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text style={[styles.catText, selectedCategory === item.id && styles.activeCatText]}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item: any) => item.id ?? 'all'}
        style={styles.catList}
        showsHorizontalScrollIndicator={false}
      />
      <FlatList
        data={items}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }: { item: MenuItem }) => (
          <TouchableOpacity style={styles.menuCard}>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />}
            <View style={styles.menuInfo}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuName}>{item.name}</Text>
                <View style={[styles.vegBadge, { backgroundColor: item.isVeg ? colors.secondary : colors.error }]}>
                  <Text style={styles.vegText}>{item.isVeg ? 'VEG' : 'NON-VEG'}</Text>
                </View>
              </View>
              {item.description && <Text style={styles.menuDesc} numberOfLines={2}>{item.description}</Text>}
              <View style={styles.menuFooter}>
                <Text style={styles.menuPrice}>₹{item.price.toFixed(2)}</Text>
                <TouchableOpacity style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add +</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{isLoading ? 'Loading...' : 'No items found'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  catList: { maxHeight: 50, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  catChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray[100], marginRight: spacing.xs },
  activeCat: { backgroundColor: colors.primary },
  catText: { fontSize: fontSize.sm, color: colors.textSecondary },
  activeCatText: { color: colors.white, fontWeight: '600' },
  list: { padding: spacing.md },
  menuCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, marginBottom: spacing.sm, overflow: 'hidden', elevation: 1 },
  menuImage: { width: '100%', height: 150 },
  menuInfo: { padding: spacing.md },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, flex: 1 },
  vegBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  vegText: { fontSize: 10, fontWeight: '700', color: colors.white },
  menuDesc: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  menuFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  menuPrice: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  addButtonText: { color: colors.white, fontWeight: '600', fontSize: fontSize.sm },
  empty: { textAlign: 'center', color: colors.textSecondary, padding: spacing.xl },
});
