// MainScreen.js
import React, { useRef, useState, useEffect } from 'react';
import { View, Animated, StyleSheet, Text, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/common/Header';
import GameCard from '../components/games/GameCard';
import { fetchGameAssets } from '../config/firebase';
import { useUser } from '../context/UserContext';

const MainScreen = () => {
  const { width } = Dimensions.get('window');
  const CARD_WIDTH = width - 32; // Responsive card width
  const scrollY = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameAssets, setGameAssets] = useState([]);
  // NEW: Get balance from UserContext
  const { balance } = useUser();

  // NEW: Add useEffect to monitor balance changes
  useEffect(() => {
    console.log("Balance updated:", balance);
  }, [balance]);

  useEffect(() => {
    const loadGameAssets = async () => {
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
    };

    loadGameAssets();
  }, []);

  const titleScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 0.8],
    extrapolate: 'clamp',
  });

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
          {gameAssets.map((game, index) => {
            const inputRange = [
              -1, 0,
              (index * 150), // Increased from 130 for better spacing
              ((index + 1) * 150)
            ];
            
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

            return (
              <Animated.View 
                key={game.id}
                style={[
                  styles.cardContainer,
                  {
                    transform: [
                      { scale },
                      { translateY }
                    ],
                    opacity
                  }
                ]}
              >
                <GameCard
                  game={game}
                  style={{ width: CARD_WIDTH, minHeight: 140 }} // Increased height
                />
              </Animated.View>
            );
          })}
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