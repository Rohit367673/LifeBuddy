import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/api';
import Button from '../../components/common/Button';

const PremiumScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubscriptionStatus();
      if (response.success && response.data) {
        setSubscriptionStatus(response.data);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await apiService.upgradeToPremium();
      if (response.success) {
        Alert.alert('Success', 'Welcome to Premium!');
        loadSubscriptionStatus();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upgrade to premium');
    }
  };

  const PremiumFeature = ({ title, description, icon, included = true }: {
    title: string;
    description: string;
    icon: string;
    included?: boolean;
  }) => (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon as any}
          size={24}
          color={included ? theme.colors.success : theme.colors.textSecondary}
        />
      </View>
      <View style={styles.featureContent}>
        <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      {included && (
        <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
      )}
    </View>
  );

  const PricingCard = ({ title, price, period, features, popular = false, onPress }: {
    title: string;
    price: string;
    period: string;
    features: string[];
    popular?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.pricingCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: popular ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      {popular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}
      
      <Text style={[styles.pricingTitle, { color: theme.colors.text }]}>{title}</Text>
      <View style={styles.pricingAmount}>
        <Text style={[styles.pricingPrice, { color: theme.colors.text }]}>{price}</Text>
        <Text style={[styles.pricingPeriod, { color: theme.colors.textSecondary }]}>
          /{period}
        </Text>
      </View>
      
      <View style={styles.pricingFeatures}>
        {features.map((feature, index) => (
          <View key={index} style={styles.pricingFeature}>
            <Ionicons name="checkmark" size={16} color={theme.colors.success} />
            <Text style={[styles.pricingFeatureText, { color: theme.colors.text }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>
      
      <Button
        title={popular ? 'Get Started' : 'Choose Plan'}
        onPress={onPress}
        variant={popular ? 'primary' : 'outline'}
        fullWidth
        size="medium"
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading premium features...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Premium</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Unlock advanced features and boost your productivity
          </Text>
        </View>

        {/* Current Status */}
        {user?.isPremium ? (
          <View style={[styles.statusCard, { backgroundColor: theme.colors.success + '10' }]}>
            <View style={styles.statusHeader}>
              <Ionicons name="star" size={24} color={theme.colors.success} />
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                Premium Active
              </Text>
            </View>
            <Text style={[styles.statusDescription, { color: theme.colors.textSecondary }]}>
              You have access to all premium features
            </Text>
            {subscriptionStatus?.expiryDate && (
              <Text style={[styles.statusExpiry, { color: theme.colors.textSecondary }]}>
                Expires: {new Date(subscriptionStatus.expiryDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.statusCard, { backgroundColor: theme.colors.warning + '10' }]}>
            <View style={styles.statusHeader}>
              <Ionicons name="star-outline" size={24} color={theme.colors.warning} />
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                Free Plan
              </Text>
            </View>
            <Text style={[styles.statusDescription, { color: theme.colors.textSecondary }]}>
              Upgrade to unlock premium features
            </Text>
          </View>
        )}

        {/* Features Comparison */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Features Comparison
          </Text>
          
          <View style={[styles.comparisonCard, { backgroundColor: theme.colors.surface }]}>
            <PremiumFeature
              title="Unlimited Events"
              description="Create unlimited life events"
              icon="calendar"
              included={true}
            />
            <PremiumFeature
              title="Advanced Analytics"
              description="Detailed insights and reports"
              icon="analytics"
              included={user?.isPremium}
            />
            <PremiumFeature
              title="Priority Support"
              description="Get help faster with priority support"
              icon="headset"
              included={user?.isPremium}
            />
            <PremiumFeature
              title="Custom Themes"
              description="Personalize your app appearance"
              icon="color-palette"
              included={user?.isPremium}
            />
            <PremiumFeature
              title="Data Export"
              description="Export your data anytime"
              icon="download"
              included={user?.isPremium}
            />
            <PremiumFeature
              title="Advanced Reminders"
              description="Smart notifications and reminders"
              icon="notifications"
              included={user?.isPremium}
            />
          </View>
        </View>

        {/* Pricing Plans */}
        {!user?.isPremium && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Choose Your Plan
            </Text>
            
            <View style={styles.pricingContainer}>
              <PricingCard
                title="Monthly"
                price="$9.99"
                period="month"
                features={[
                  'All premium features',
                  'Priority support',
                  'Advanced analytics',
                  'Data export',
                ]}
                onPress={handleUpgrade}
              />
              
              <PricingCard
                title="Yearly"
                price="$99.99"
                period="year"
                features={[
                  'All premium features',
                  'Priority support',
                  'Advanced analytics',
                  'Data export',
                  '2 months free',
                ]}
                popular={true}
                onPress={handleUpgrade}
              />
            </View>
          </View>
        )}

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Why Upgrade?
          </Text>
          
          <View style={styles.benefitsContainer}>
            <View style={[styles.benefitCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="trending-up" size={32} color={theme.colors.primary} />
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Boost Productivity
              </Text>
              <Text style={[styles.benefitDescription, { color: theme.colors.textSecondary }]}>
                Advanced tools to help you stay organized and achieve your goals
              </Text>
            </View>
            
            <View style={[styles.benefitCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="shield-checkmark" size={32} color={theme.colors.success} />
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Enhanced Security
              </Text>
              <Text style={[styles.benefitDescription, { color: theme.colors.textSecondary }]}>
                Advanced security features to protect your personal data
              </Text>
            </View>
            
            <View style={[styles.benefitCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="headset" size={32} color={theme.colors.warning} />
              <Text style={[styles.benefitTitle, { color: theme.colors.text }]}>
                Priority Support
              </Text>
              <Text style={[styles.benefitDescription, { color: theme.colors.textSecondary }]}>
                Get help faster with dedicated premium support
              </Text>
            </View>
          </View>
        </View>
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
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusExpiry: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  comparisonCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
  },
  pricingContainer: {
    paddingHorizontal: 20,
  },
  pricingCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pricingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pricingAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pricingPeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  pricingFeatures: {
    marginBottom: 20,
  },
  pricingFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingFeatureText: {
    fontSize: 14,
    marginLeft: 8,
  },
  benefitsContainer: {
    paddingHorizontal: 20,
  },
  benefitCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PremiumScreen; 