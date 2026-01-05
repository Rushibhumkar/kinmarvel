// src/calling/CallingMain.tsx
import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppToast} from '../components/toast/AppToast';
declare const require: any;
const MaterialIcons =
  require('react-native-vector-icons/MaterialIcons').default;

const {width} = Dimensions.get('window');

const CallingMain = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const toast = useAppToast();
  const callingPlans = [
    {
      id: 'audio-basic',
      title: 'Audio Basic',
      description: 'Perfect for voice conversations',
      price: '₹299',
      duration: 'per month',
      features: [
        '30 Audio calls',
        'HD Voice Quality',
        'Call Recording',
        'No Video Calls',
        'No Group Calls',
      ],
      popular: false,
      gradient: ['#667eea', '#764ba2'],
      icon: 'mic',
    },
    {
      id: 'video-basic',
      title: 'Video Basic',
      description: 'Face-to-face conversations',
      price: '₹499',
      duration: 'per month',
      features: [
        '30 Video calls',
        'HD Video Quality',
        'Screen Sharing',
        'Background Blur',
        'No Group Calls',
      ],
      popular: false,
      gradient: ['#f093fb', '#f5576c'],
      icon: 'videocam',
    },
    {
      id: 'audio-video-30',
      title: 'Audio + Video Pro',
      description: 'Complete communication package',
      price: '₹799',
      duration: 'per month',
      features: [
        '30 Total calls (Audio/Video)',
        'HD Audio & Video',
        'Group Calls (up to 4)',
        'Screen Sharing',
        'Call Recording',
      ],
      popular: true,
      gradient: ['#4facfe', '#00f2fe'],
      icon: 'call',
    },
    {
      id: 'audio-video-group-30',
      title: 'Team Starter',
      description: 'For small teams and families',
      price: '₹999',
      duration: 'per month',
      features: [
        '30 Total calls',
        'Group Calls (up to 8)',
        'Meeting Scheduling',
        'Custom Backgrounds',
        'Recording & Transcripts',
      ],
      popular: false,
      gradient: ['#43e97b', '#38f9d7'],
      icon: 'group',
    },
    {
      id: 'unlimited-basic',
      title: 'Unlimited Connect',
      description: 'Unlimited conversations',
      price: '₹1,499',
      duration: 'per month',
      features: [
        'Unlimited Audio/Video Calls',
        'Group Calls (up to 10)',
        '24/7 Priority Support',
        'Advanced Analytics',
        'Cloud Storage (10GB)',
      ],
      popular: false,
      gradient: ['#fa709a', '#fee140'],
      icon: 'all-inclusive',
    },
    {
      id: 'business-pro',
      title: 'Business Pro',
      description: 'For professional teams',
      price: '₹2,999',
      duration: 'per month',
      features: [
        'Unlimited Everything',
        'Group Calls (up to 50)',
        'Admin Controls',
        'Advanced Security',
        'Cloud Storage (100GB)',
        'Custom Branding',
      ],
      popular: false,
      gradient: ['#a8edea', '#fed6e3'],
      icon: 'business',
    },
    {
      id: 'enterprise',
      title: 'Enterprise',
      description: 'Custom solutions',
      price: 'Custom',
      duration: 'Contact Sales',
      features: [
        'Unlimited Users',
        'Group Calls (100+)',
        'Dedicated Support',
        'SLA 99.9% Uptime',
        'API Access',
        'Custom Features',
      ],
      popular: false,
      gradient: ['#d4fc79', '#96e6a1'],
      icon: 'star',
    },
  ];

  const featuresComparison = [
    {
      feature: 'Audio Calls',
      basic: '✓ 30',
      pro: '✓ 30',
      unlimited: '✓ Unlimited',
      enterprise: '✓ Unlimited',
    },
    {
      feature: 'Video Calls',
      basic: '✗',
      pro: '✓ 30',
      unlimited: '✓ Unlimited',
      enterprise: '✓ Unlimited',
    },
    {
      feature: 'Group Calls',
      basic: '✗',
      pro: '✓ 4 People',
      unlimited: '✓ 10 People',
      enterprise: '✓ 100+ People',
    },
    {
      feature: 'Call Recording',
      basic: '✓',
      pro: '✓',
      unlimited: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Screen Sharing',
      basic: '✗',
      pro: '✓',
      unlimited: '✓',
      enterprise: '✓',
    },
    {
      feature: 'Cloud Storage',
      basic: '✗',
      pro: '1GB',
      unlimited: '10GB',
      enterprise: '100GB+',
    },
    {
      feature: 'Priority Support',
      basic: '✗',
      pro: 'Business Hours',
      unlimited: '24/7',
      enterprise: 'Dedicated',
    },
    {
      feature: 'Custom Branding',
      basic: '✗',
      pro: '✗',
      unlimited: '✗',
      enterprise: '✓',
    },
  ];

  const handleBuyNow = (planId: string) => {
    setSelectedPlan(planId);
    // Navigate to payment screen or handle purchase
    console.log('Buying plan:', planId);
    // navigation.navigate('Payment', { planId });
    toast.success('coming soon');
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          activeOpacity={0.7}>
          <Image
            source={require('../assets/icons/back.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Premium Calling Plans</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.heroSection}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <Text style={styles.heroTitle}>Upgrade Your Calling Experience</Text>
          <Text style={styles.heroSubtitle}>
            HD Audio & Video • Secure Calls • Advanced Features
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Happy Users</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>99.9%</Text>
              <Text style={styles.statLabel}>Uptime</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Popular Plan Badge */}
        <View style={styles.popularBadge}>
          <MaterialIcons
            name="local-fire-department"
            size={20}
            color="#FF6B6B"
          />
          <Text style={styles.popularText}>
            Most Popular: Audio + Video Pro
          </Text>
        </View>

        {/* Plans Grid */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <Text style={styles.sectionSubtitle}>
            Select the perfect plan for your communication needs
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}>
            {callingPlans.map(plan => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
                activeOpacity={0.9}>
                {plan.popular && (
                  <View style={styles.popularTag}>
                    <Text style={styles.popularTagText}>POPULAR</Text>
                  </View>
                )}

                <LinearGradient
                  colors={plan.gradient}
                  style={styles.cardHeader}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  <MaterialIcons name={plan.icon} size={30} color="#FFF" />
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </LinearGradient>

                <View style={styles.cardBody}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>{plan.price}</Text>
                    <Text style={styles.duration}>{plan.duration}</Text>
                  </View>

                  <View style={styles.featuresList}>
                    {plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <MaterialIcons
                          name={
                            feature.startsWith('✓')
                              ? 'check-circle'
                              : feature.startsWith('✗')
                              ? 'cancel'
                              : 'circle'
                          }
                          size={16}
                          color={
                            feature.startsWith('✓')
                              ? '#43e97b'
                              : feature.startsWith('✗')
                              ? '#FF6B6B'
                              : '#4facfe'
                          }
                          style={styles.featureIcon}
                        />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.buyButton,
                      selectedPlan === plan.id && styles.buyButtonActive,
                    ]}
                    onPress={() => handleBuyNow(plan.id)}>
                    <Text style={styles.buyButtonText}>
                      {plan.price === 'Custom' ? 'CONTACT SALES' : 'BUY NOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Feature Comparison Table */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>Plan Comparison</Text>

          <View style={styles.comparisonTable}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.featureHeader]}>
                <Text style={styles.tableHeaderText}>Features</Text>
              </View>
              <View style={[styles.tableCell, styles.planHeader]}>
                <Text style={styles.planHeaderText}>Basic</Text>
                <Text style={styles.planSubText}>₹299/mo</Text>
              </View>
              <View style={[styles.tableCell, styles.planHeader]}>
                <Text style={styles.planHeaderText}>Pro</Text>
                <Text style={styles.planSubText}>₹799/mo</Text>
              </View>
              <View style={[styles.tableCell, styles.planHeader]}>
                <Text style={styles.planHeaderText}>Unlimited</Text>
                <Text style={styles.planSubText}>₹1,499/mo</Text>
              </View>
              <View style={[styles.tableCell, styles.planHeader]}>
                <Text style={styles.planHeaderText}>Enterprise</Text>
                <Text style={styles.planSubText}>Custom</Text>
              </View>
            </View>

            {/* Table Rows */}
            {featuresComparison.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowEven,
                ]}>
                <View style={[styles.tableCell, styles.featureCell]}>
                  <Text style={styles.featureCellText}>{item.feature}</Text>
                </View>
                <View style={[styles.tableCell, styles.planCell]}>
                  <Text
                    style={[
                      styles.planCellText,
                      item.basic.startsWith('✓') && styles.available,
                      item.basic.startsWith('✗') && styles.unavailable,
                    ]}>
                    {item.basic}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.planCell]}>
                  <Text
                    style={[
                      styles.planCellText,
                      item.pro.startsWith('✓') && styles.available,
                      item.pro.startsWith('✗') && styles.unavailable,
                    ]}>
                    {item.pro}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.planCell]}>
                  <Text
                    style={[
                      styles.planCellText,
                      item.unlimited.startsWith('✓') && styles.available,
                      item.unlimited.startsWith('✗') && styles.unavailable,
                    ]}>
                    {item.unlimited}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.planCell]}>
                  <Text
                    style={[
                      styles.planCellText,
                      item.enterprise.startsWith('✓') && styles.available,
                      item.enterprise.startsWith('✗') && styles.unavailable,
                    ]}>
                    {item.enterprise}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>
              Can I upgrade or downgrade my plan?
            </Text>
            <Text style={styles.faqAnswer}>
              Yes, you can change your plan at any time. Changes will be
              prorated.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              All paid plans come with a 7-day free trial. No credit card
              required.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>
              What payment methods do you accept?
            </Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit/debit cards, UPI, Net Banking, and
              PayPal.
            </Text>
          </View>
        </View>

        {/* CTA Section */}
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          style={styles.ctaSection}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          <Text style={styles.ctaTitle}>Still have questions?</Text>
          <Text style={styles.ctaSubtitle}>
            Our team is here to help you choose the right plan
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <MaterialIcons name="chat" size={20} color="#4facfe" />
            <Text style={styles.ctaButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

export default CallingMain;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9E9E9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#111',
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#111',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 40,
  },
  heroSection: {
    padding: 24,
    margin: 16,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  popularText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  plansContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  horizontalScroll: {
    marginHorizontal: -16,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  planCard: {
    width: width * 0.8,
    marginRight: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: '#4facfe',
    transform: [{scale: 1.02}],
  },
  popularTag: {
    position: 'absolute',
    top: 12,
    right: -30,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 4,
    transform: [{rotate: '45deg'}],
    zIndex: 1,
  },
  popularTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardHeader: {
    padding: 20,
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 12,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  cardBody: {
    padding: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111',
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#444',
    flex: 1,
  },
  buyButton: {
    backgroundColor: '#4facfe',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyButtonActive: {
    backgroundColor: '#1890ff',
    transform: [{scale: 1.05}],
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonSection: {
    marginTop: 40,
    paddingHorizontal: 16,
  },
  comparisonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  comparisonTable: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4facfe',
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
  },
  tableCell: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    flex: 1,
    justifyContent: 'center',
  },
  featureHeader: {
    flex: 1.5,
    backgroundColor: '#2a8bda',
  },
  tableHeaderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
  },
  planHeaderText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  planSubText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableRowEven: {
    backgroundColor: '#F9F9F9',
  },
  featureCell: {
    flex: 1.5,
    backgroundColor: '#F8FBFF',
  },
  featureCellText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  planCell: {
    alignItems: 'center',
  },
  planCellText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  available: {
    color: '#43e97b',
    fontWeight: '600',
  },
  unavailable: {
    color: '#FF6B6B',
  },
  faqSection: {
    marginTop: 40,
    paddingHorizontal: 16,
  },
  faqTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  ctaSection: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 30,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#4facfe',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
