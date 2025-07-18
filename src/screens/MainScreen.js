import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  TouchableOpacity,
  Linking,
  View,
  Animated,
  StyleSheet,
  Text,
  Dimensions,
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import NotificationBanner from '../components/common/NotificationBanner';
import { fetchGameAssets } from '../config/firebase';
import { useUser } from '../context/UserContext';
import { colors } from './theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // Adjusted for more padding

// ==================== COMPONENTS ====================

// Simple Hero Section
const SimpleGamingHero = React.memo(({ gameCount, selectedSection, filteredCount }) => {
  return (
    <View style={styles.heroContainer}>
      <Text style={styles.heroTitle}>GAME ASSETS</Text>
      <Text style={styles.heroSubtitle}>
        {selectedSection === 'all'
          ? `Explore ${gameCount} premium assets`
          : `Showing ${filteredCount} ${selectedSection} assets`
        }
      </Text>
      <View style={styles.heroDivider} />
    </View>
  );
});

// Clean Filter Bar
const CleanGamingFilter = React.memo(({ sections, selectedSection, onSectionChange }) => {
  const sectionConfigs = {
    survival: { emoji: '🌲', name: 'Survival' },
    lifesteal: { emoji: '⚔️', name: 'Lifesteal' },
    creative: { emoji: '🎨', name: 'Creative' },
    pvp: { emoji: '⚡', name: 'PvP' },
    skyblock: { emoji: '☁️', name: 'Skyblock' },
    prison: { emoji: '🔒', name: 'Prison' },
  };

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedSection === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => onSectionChange('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, selectedSection === 'all' && styles.filterButtonTextActive]}>
            🎮 All Games
          </Text>
        </TouchableOpacity>
        {sections.map((section) => {
          const config = sectionConfigs[section.toLowerCase()] || {
            emoji: '🎮',
            name: section,
          };
          const isActive = selectedSection === section;
          return (
            <TouchableOpacity
              key={section}
              style={[
                styles.filterButton,
                isActive && styles.filterButtonActive,
              ]}
              onPress={() => onSectionChange(section)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                {config.emoji} {config.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

// Animated Game Card (Simplified)
const AnimatedGameCard = React.memo(({ game, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 16,
        width: CARD_WIDTH,
        alignSelf: 'center',
      }}
    >
      <GameCard
        game={game}
        style={styles.gameCard}
        showSection={true}
      />
    </Animated.View>
  );
});

// Section Header (Simplified)
const SimpleSectionHeader = React.memo(({ title, count }) => {
  return (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <Text style={styles.sectionCount}>{count} Assets</Text>
    </View>
  );
});

// Loading State
const SimpleLoadingState = React.memo(() => (
  <View style={styles.centeredContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
    <Text style={styles.loadingText}>Loading Assets...</Text>
  </View>
));

// Error State
const SimpleErrorState = React.memo(({ error, onRetry }) => (
  <View style={styles.centeredContainer}>
    <Text style={styles.errorText}>Error: {error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
));

// Empty State
const SimpleEmptyState = React.memo(({ selectedSection }) => (
  <View style={styles.centeredContainer}>
    <Text style={styles.emptyText}>No {selectedSection !== 'all' ? selectedSection : ''} assets found.</Text>
  </View>
));

// ==================== MAIN COMPONENT ====================

const MainScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('all');
  const { balance } = useUser();

  const loadGameAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const assets = await fetchGameAssets();
      const normalizedAssets = assets.map(asset => ({
        ...asset,
        section: asset.section || 'survival',
      }));
      if (normalizedAssets.length === 0) {
        setError('No game assets available');
      } else {
        setGameAssets(normalizedAssets);
        const uniqueSections = [
          ...new Set(normalizedAssets.map((g) => g.section).filter(Boolean))
        ].sort();
        setSections(uniqueSections);
      }
    } catch (err) {
      console.error('Error loading game assets:', err);
      setError('Failed to load game assets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGameAssets();
  }, [loadGameAssets]);

  const filteredGames = useMemo(() => {
    return selectedSection === 'all'
      ? gameAssets
      : gameAssets.filter((g) => g.section === selectedSection);
  }, [gameAssets, selectedSection]);

  const groupedGames = useMemo(() => {
    return sections.reduce((acc, section) => {
      acc[section] = gameAssets.filter((g) => g.section === section);
      return acc;
    }, {});
  }, [gameAssets, sections]);

  const renderGameContent = () => {
    if (filteredGames.length === 0) {
      return <SimpleEmptyState selectedSection={selectedSection} />;
    }
    if (selectedSection === 'all') {
      return sections.map((section) => {
        const sectionGames = groupedGames[section];
        if (sectionGames.length === 0) return null;
        return (
          <View key={section} style={styles.sectionGroup}>
            <SimpleSectionHeader
              title={section.charAt(0).toUpperCase() + section.slice(1)}
              count={sectionGames.length}
            />
            <View style={styles.gamesList}>
              {sectionGames.map((game, index) => (
                <AnimatedGameCard
                  key={game.id}
                  game={game}
                  index={index}
                />
              ))}
            </View>
          </View>
        );
      });
    } else {
      return (
        <View style={styles.gamesList}>
          {filteredGames.map((game, index) => (
            <AnimatedGameCard
              key={game.id}
              game={game}
              index={index}
            />
          ))}
        </View>
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <SimpleLoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />
        <Header balance={balance} />
        <NotificationBanner />
        <SimpleErrorState error={error} onRetry={loadGameAssets} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient colors={colors.gradientDark} style={StyleSheet.absoluteFill} />

      <Header balance={balance} />
      <NotificationBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <SimpleGamingHero
          gameCount={gameAssets.length}
          selectedSection={selectedSection}
          filteredCount={filteredGames.length}
        />

        <CleanGamingFilter
          sections={sections}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
        />

        {renderGameContent()}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Support FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => Linking.openURL('https://t.me/xgamingclub')}
      >
        <LinearGradient colors={colors.activeGradient} style={styles.fabGradient}>
          <Text style={styles.fabText}>SUPPORT</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },

  // Centered Containers for Loading/Error/Empty
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.lightText,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  retryButtonText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
  },

  // Hero Section
  heroContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.accent,
    letterSpacing: 1.5,
    marginBottom: 8,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.lightText,
    opacity: 0.85,
    marginBottom: 15,
  },
  heroDivider: {
    width: 170,
    height: 3,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },

  // Filter Bar
  filterContainer: {
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: colors.accent,
    shadowColor: colors.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  filterButtonText: {
    color: colors.lightText,
    fontWeight: '700',
    fontSize: 13,
  },
  filterButtonTextActive: {
    color: colors.text,
  },

  // Game Cards
  gamesList: {
    paddingHorizontal: 20,
  },

  // Section Headers
  sectionGroup: {
    marginBottom: 30,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedText,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 30 : 20,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.fabShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  fabText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default MainScreen;