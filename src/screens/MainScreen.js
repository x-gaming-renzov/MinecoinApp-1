// MainScreen.js
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { View, Animated, StyleSheet, Text, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import { fetchGameAssets } from '../config/firebase';
import { useUser } from '../context/UserContext';

// NEW: Memoized animated game card component
const AnimatedGameCard = React.memo(({ game, scrollY, index, CARD_WIDTH }) => {
  const inputRange = useMemo(() => [
    -1, 
    0,
    (index * 150),
    ((index + 1) * 150)
  ], [index]);

  const animatedStyle = useMemo(() => {
    const scale = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.95],
    });
    
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [1, 1, 1, 0.85],
    });

    const translateY = scrollY.interpolate({
      inputRange,
      outputRange: [0, 0, 0, -20],
    });

    return {
      transform: [{ scale }, { translateY }],
      opacity
    };
  }, [scrollY, inputRange]);

  return (
    <Animated.View 
      key={game.id}
      style={[styles.cardContainer, animatedStyle]}
    >
      <GameCard
        game={game}
        style={{ width: CARD_WIDTH, minHeight: 140 }}
      />
    </Animated.View>
  );
});

const MainScreen = () => {
  const { width } = Dimensions.get('window');
  const CARD_WIDTH = width - 32;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]);
  const { balance } = useUser();

  const loadGameAssets = useCallback(async () => {
    try {
      setLoading(true);
      const assets = await fetchGameAssets();
      if (assets.length === 0) {
        setError('No game assets available');
      } else {
        setGameAssets(assets);
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

  const titleScale = useMemo(() => 
    scrollY.interpolate({
      inputRange: [-100, 0, 100],
      outputRange: [1.2, 1, 0.8],
      extrapolate: 'clamp',
    }), [scrollY]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header balance={balance} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading game assets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header balance={balance} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header balance={balance} />
      <Animated.View 
        style={[
          styles.titleWrapper,
          {
            transform: [{ scale: titleScale }]
          }
        ]}
      >
        <Text style={styles.title}>Game Assets</Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.gamesGrid}>
          {gameAssets.map((game, index) => (
            <AnimatedGameCard
              key={game.id}
              game={game}
              scrollY={scrollY}
              index={index}
              CARD_WIDTH={CARD_WIDTH}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2feff',
  },
  titleWrapper: {
    backgroundColor: '#f2feff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  gamesGrid: {
    alignItems: 'center',
    gap: 16,
  },
  cardContainer: {
    width: '100%',
    borderRadius: 24,
    marginBottom: 8,
    shadowColor: '#7C3AED',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
});

export default MainScreen;