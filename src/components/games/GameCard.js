// GameCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import InsufficientBalance from './InsufficientBalanceModal';
import { updateUserBalance, savePurchaseHistory } from '../../config/firebase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GameCard = ({ game, style }) => {
  const navigation = useNavigation();
  const { hasSufficientBalance, processPurchase, hasMcVerified } = useUser();
  const { isLoggedIn, user } = useAuth();
  const [showBuyButton, setShowBuyButton] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  const handleCoinPress = () => {
    setError(null);
    setShowBuyButton(true);
  };

  const handleBuyPress = async () => {
    if (!isLoggedIn) {
      navigation.navigate('Profile');
      return;
    }

    if (!hasSufficientBalance(game.price)) {
      setShowInsufficientBalance(true);
      return;
    }

    if (!hasMcVerified) {
      navigation.navigate('Profile', { 
        screen: 'MC Verification',
        params: { returnTo: 'GameAssets' }
      });
      return;
    }

    try {
      setPurchasing(true);
      setError(null);
      
      await updateUserBalance(user.email, game.price);
      await savePurchaseHistory(user.email, {
        gameId: game.id,
        title: game.title,
        price: game.price,
        purchaseDate: new Date(),
        gamegiven: false
      });
      await processPurchase(game.price, { title: game.title });
      
      navigation.navigate('PaymentSuccess', { game });
      setShowBuyButton(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      if (error.message === 'Minecraft verification required') {
        navigation.navigate('Profile', { 
          screen: 'MC Verification',
          params: { returnTo: 'GameAssets' }
        });
      } else {
        setError('Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const cardWidth = style?.width || SCREEN_WIDTH - 32;
  const imageWidth = cardWidth * 0.4;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.leftSection, { width: imageWidth }]}>
        <Image 
          source={game.imageUrl ? { uri: game.imageUrl } : require('../../../assets/bat.png')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.tagsContainer}>
          {game.discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.tagText}>{game.discount}% OFF</Text>
            </View>
          )}
          {game.isNew && (
            <View style={styles.newTag}>
              <Text style={styles.tagText}>NEW</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {game.title}
          </Text>
          <Text style={styles.passText}>Pass</Text>
          <Text style={styles.achievementText} numberOfLines={2} ellipsizeMode="tail">
            {game.achievementText}
          </Text>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {!showBuyButton ? (
          <TouchableOpacity
            style={styles.priceButton}
            onPress={handleCoinPress}
            disabled={purchasing}
          >
            <Text style={styles.priceText}>{game.price}</Text>
            <Image
              source={require('../../../assets/rupee.png')}
              style={styles.coinIcon}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.buyButton, purchasing && styles.buyButtonDisabled]}
            onPress={handleBuyPress}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buyText}>Buy Now</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <InsufficientBalance
        visible={showInsufficientBalance}
        onClose={() => {
          setShowInsufficientBalance(false);
          setShowBuyButton(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  leftSection: {
    position: 'relative',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
  },
  tagsContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 4,
  },
  discountTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  rightSection: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  titleContainer: {
    gap: 4,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 0.2,
  },
  passText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  achievementText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  priceButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 4,
    marginTop: 8,
  },
  buyButton: {
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
});

export default GameCard;