import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/api';
import { StoreItem } from '../../types';
import Button from '../../components/common/Button';

const StoreScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadStoreItems();
  }, []);

  const loadStoreItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStoreItems();
      if (response.success && response.data) {
        setStoreItems(response.data);
      }
    } catch (error) {
      console.error('Error loading store items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (item: StoreItem) => {
    Alert.alert(
      'Purchase Item',
      `Are you sure you want to purchase "${item.name}" for ${item.price} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            Alert.alert('Success', 'Item purchased successfully!');
          },
        },
      ]
    );
  };

  const categories = [
    { id: 'all', name: 'All Items', icon: 'grid-outline' },
    { id: 'themes', name: 'Themes', icon: 'color-palette-outline' },
    { id: 'badges', name: 'Badges', icon: 'ribbon-outline' },
    { id: 'features', name: 'Features', icon: 'star-outline' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? storeItems 
    : storeItems.filter(item => item.category === selectedCategory);

  const CategoryButton = ({ category }: { category: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        {
          backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons
        name={category.icon as any}
        size={20}
        color={selectedCategory === category.id ? '#FFFFFF' : theme.colors.text}
      />
      <Text
        style={[
          styles.categoryText,
          {
            color: selectedCategory === category.id ? '#FFFFFF' : theme.colors.text,
          },
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const StoreItemCard = ({ item }: { item: StoreItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => handlePurchase(item)}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name="image-outline" size={32} color={theme.colors.primary} />
        </View>
      )}
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
          {item.description}
        </Text>
        
        <View style={styles.itemFooter}>
          <View style={styles.itemPrice}>
            <Ionicons name="star" size={16} color={theme.colors.warning} />
            <Text style={[styles.priceText, { color: theme.colors.text }]}>
              {item.price} points
            </Text>
          </View>
          
          <Button
            title="Purchase"
            onPress={() => handlePurchase(item)}
            variant="primary"
            size="small"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading store...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Store</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Purchase items with your points
          </Text>
        </View>

        {/* Points Display */}
        <View style={[styles.pointsCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.pointsHeader}>
            <Ionicons name="star" size={24} color={theme.colors.warning} />
            <Text style={[styles.pointsTitle, { color: theme.colors.text }]}>
              Your Points
            </Text>
          </View>
          <Text style={[styles.pointsAmount, { color: theme.colors.warning }]}>
            {user?.totalPoints || 0}
          </Text>
          <Text style={[styles.pointsSubtitle, { color: theme.colors.textSecondary }]}>
            Earn points by completing tasks and events
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Categories
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesList}>
              {categories.map((category) => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Store Items */}
        <View style={styles.itemsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Available Items
          </Text>
          
          {filteredItems.length > 0 ? (
            <View style={styles.itemsGrid}>
              {filteredItems.map((item) => (
                <StoreItemCard key={item._id} item={item} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bag-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No items found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Check back later for new items
              </Text>
            </View>
          )}
        </View>

        {/* Featured Items */}
        {storeItems.filter(item => item.category === 'themes').length > 0 && (
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Featured Themes
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.featuredList}>
                {storeItems
                  .filter(item => item.category === 'themes')
                  .slice(0, 3)
                  .map((item) => (
                    <StoreItemCard key={item._id} item={item} />
                  ))}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pointsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pointsSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categoriesList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsGrid: {
    paddingHorizontal: 20,
  },
  itemCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  featuredSection: {
    marginBottom: 20,
  },
  featuredList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
});

export default StoreScreen; 