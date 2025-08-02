import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import Video from 'react-native-video';
import { Gift, X, Star, Coins, Play, Shuffle } from 'lucide-react-native';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { savePurchaseHistory } from '../../config/firebase';
import InsufficientBalance from '../games/InsufficientBalanceModal';
import { Easing } from 'react-native';
import { colors } from '../../screens/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOX_SIZE = (SCREEN_WIDTH * 0.85 - 72) / 3;
const BOX_MARGIN = 6;
const NUM_BOXES = 9;
const GRID_SIZE = 3;

const VISIBLE_SHUFFLE_STEPS = 5;
const INTERNAL_SHUFFLE_STEPS = 8;
const SHUFFLE_STEP_DELAY = 4;

const getGridPosition = (index) => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  return {
    x: col * (BOX_SIZE + BOX_MARGIN),
    y: row * (BOX_SIZE + BOX_MARGIN),
  };
};

const CalendarCard = () => {
  // State variables
  const [inputAmount, setInputAmount] = useState('');
  const [gameAssets, setGameAssets] = useState([]);
  const [showBoxSelection, setShowBoxSelection] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [reward, setReward] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [maxReward, setMaxReward] = useState(0);
  const [error, setError] = useState(null);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([...Array(NUM_BOXES).keys()]);
  const anims = useRef([...Array(NUM_BOXES)].map(() => new Animated.ValueXY(getGridPosition(0)))).current;
  const [isGettingReward, setIsGettingReward] = useState(false);
  const [rewardGiven, setRewardGiven] = useState(false);
  const [showRewardText, setShowRewardText] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State to hold the content of boxes once they are opened
  const [openedBoxes, setOpenedBoxes] = useState({});

  const { isLoggedIn, user } = useAuth();
  const { balance, subtractBalance, addBalance, hasSufficientBalance } = useUser();

  // Config state fetched from Firebase
  const [chancesConfig, setChancesConfig] = useState({
    assetChance: 0.6,
    coinChances: [
      { range: [0, 1], chance: 0.925 },
      { range: [2, 4], chance: 0.025 },
      { range: [4, 5], chance: 0.01 },
    ],
    maxRewardMultiplier: 5,
    assetCountRange: [4, 7],
    assetMaxPriceMultiplier: 3,
  });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Fetch chances config from Firebase
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'appConfig', 'luckyBoxChances');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setChancesConfig({
            assetChance: data.assetChance ?? 0.6,
            coinChances: data.coinChances ?? [],
            maxRewardMultiplier: data.maxRewardMultiplier ?? 5,
            assetCountRange: data.assetCountRange ?? [4, 7],
            assetMaxPriceMultiplier: data.assetMaxPriceMultiplier ?? 3,
          });
        }
      } catch (error) {
        console.error('Failed to fetch chances config:', error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Fetch all game assets once
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'gamesAssets'), orderBy('price', 'asc')));
        const assets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setGameAssets(assets);
      } catch (error) {
        setError('Failed to load game assets');
      }
    };
    fetchAssets();
  }, []);

  const parsedAmount = useMemo(() => {
    const val = parseInt(inputAmount);
    return Number.isNaN(val) ? 0 : val;
  }, [inputAmount]);

  // Filter assets based on the bet amount
  const filteredAssets = useMemo(() => {
    if (!parsedAmount || !gameAssets.length) return [];
    const maxPrice = parsedAmount * (chancesConfig.assetMaxPriceMultiplier ?? 3);
    return gameAssets.filter(
      (asset) => asset.price && asset.price <= maxPrice && asset.price >= parsedAmount * 0.5
    );
  }, [gameAssets, parsedAmount, chancesConfig]);

  // SECURE: Generates a SINGLE reward based on luck. Called ON-CLICK.
  const generateSingleReward = (amount, availableAssets, chances) => {
    let assetChance = chances.assetChance ?? 0.6;
    if (availableAssets.length === 0) {
      assetChance = 0; // No assets possible if none are available
    }

    const randomValue = Math.random();
    if (randomValue < assetChance) {
      // Asset win
      const randomAsset = availableAssets[Math.floor(Math.random() * availableAssets.length)];
      return {
        type: 'asset',
        value: randomAsset.title,
        imageUrl: randomAsset.imageUrl,
        assetId: randomAsset.id,
        originalPrice: randomAsset.price,
        achievementText: randomAsset.achievementText || '',
      };
    } else {
      // Coin win
      const coinRandom = Math.random();
      let cumulativeChance = 0;
      let selectedRange = chances.coinChances[0]?.range ?? [0, 1];

      for (const tier of chances.coinChances) {
        cumulativeChance += tier.chance;
        if (coinRandom < cumulativeChance) {
          selectedRange = tier.range;
          break;
        }
      }
      const [minMultiplier, maxMultiplier] = selectedRange;
      const multiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
      return {
        type: 'coins',
        value: Math.floor(amount * multiplier),
      };
    }
  };

  const handleStartGame = async () => {
    let amount = parsedAmount;
    if (!amount || amount < 50) {
      setError('Please enter a valid amount (minimum 50 coins)');
      return;
    }
    if (amount > 7000) amount = 7000;
    if (!hasSufficientBalance(amount)) {
      setShowInsufficientBalance(true);
      return;
    }

    setError(null);
    setIsStartingGame(true);
    try {
      await subtractBalance(amount);

      setMaxReward(amount * (chancesConfig.maxRewardMultiplier ?? 5));
      setShuffleOrder([...Array(NUM_BOXES).keys()]);
      [...Array(NUM_BOXES).keys()].forEach((idx, i) => anims[idx].setValue(getGridPosition(i)));

      setShowBoxSelection(true);
      setIsStartingGame(false);
      setSelectedBox(null);
      setReward(null);
      setRewardGiven(false);
      setShowRewardText(false);
      setOpenedBoxes({}); // Reset opened boxes

      // Auto-start shuffling
      setIsShuffling(true);
      doShuffleAnimation(0, shuffleOrder);
    } catch (err) {
      setError('Failed to start game. Try again.');
      setIsStartingGame(false);
      await addBalance(amount);
    }
  };

  const animateBoxesToOrder = (order, callback) => {
    const animations = order.map((boxIdx, gridIdx) => {
      const pos = getGridPosition(gridIdx);
      return Animated.timing(anims[boxIdx], {
        toValue: pos,
        duration: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: false,
      });
    });
    Animated.parallel(animations).start(callback);
  };

  const doShuffleAnimation = (step, currentOrder) => {
    if (step >= VISIBLE_SHUFFLE_STEPS) {
      let finalOrder = [...currentOrder];
      for (let i = 0; i < INTERNAL_SHUFFLE_STEPS; i++) {
        finalOrder = [...currentOrder].sort(() => Math.random() - 0.5);
      }
      animateBoxesToOrder(finalOrder, () => {
        setShuffleOrder(finalOrder);
        setIsShuffling(false);
      });
      return;
    }
    const newOrder = [...currentOrder].sort(() => Math.random() - 0.5);
    animateBoxesToOrder(newOrder, () => {
      setShuffleOrder(newOrder);
      setTimeout(() => doShuffleAnimation(step + 1, newOrder), SHUFFLE_STEP_DELAY);
    });
  };

  // SECURE: The main game logic happens here, ON-CLICK.
  const handleBoxSelect = useCallback(
    async (boxId) => {
      if (selectedBox !== null || purchasing || isShuffling || isGettingReward) return;

      setPurchasing(true);
      setSelectedBox(boxId);
      setIsGettingReward(true);
      setShowRewardText(false);
      fadeAnim.setValue(0);

      const amount = parsedAmount;
      // THE MAGIC MOMENT: Your true reward is generated right here!
      const trueReward = generateSingleReward(amount, filteredAssets, chancesConfig);

      const newOpenedBoxes = {};
      newOpenedBoxes[boxId] = trueReward; // Place the true reward

      const isCoinReward = trueReward.type === 'coins' && trueReward.value > 0;

      try {
        // Process the true reward first
        if (isCoinReward) {
          await addBalance(trueReward.value);
        }

        await savePurchaseHistory(user.email, {
          gameType: 'LuckyBox',
          amount,
          boxId,
          reward: trueReward,
          title: trueReward.type === 'asset' ? trueReward.value : 'coins',
          purchaseDate: new Date(),
          maxPossibleReward: maxReward,
          gamegiven: isCoinReward,
        });

        // For display only: generate dummy rewards for the other 8 boxes
        for (let i = 0; i < NUM_BOXES; i++) {
            if (i !== boxId) {
                newOpenedBoxes[i] = generateSingleReward(amount, filteredAssets, chancesConfig);
            }
        }

        setOpenedBoxes(newOpenedBoxes); // Reveal all boxes at once
        setReward(trueReward);
        setRewardGiven(true);
        setShowReward(true);
      } catch (error) {
        setSelectedBox(null);
        setError('Failed to get reward. Please try again.');
        await addBalance(amount);
      } finally {
        setIsGettingReward(false);
        setPurchasing(false);

        setShowRewardText(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }).start();
      }
    },
    [
      selectedBox, purchasing, isShuffling, isGettingReward, parsedAmount,
      filteredAssets, chancesConfig, openedBoxes, addBalance, savePurchaseHistory,
      user, maxReward, fadeAnim,
    ]
  );

  const resetGame = () => {
    setInputAmount('');
    setShowBoxSelection(false);
    setSelectedBox(null);
    setShowReward(false);
    setReward(null);
    setMaxReward(0);
    setError(null);
    setIsShuffling(false);
    setIsStartingGame(false);
    setShuffleOrder([...Array(NUM_BOXES).keys()]);
    setRewardGiven(false);
    setShowRewardText(false);
    setOpenedBoxes({});
    fadeAnim.setValue(0);
  };

  const renderBoxGrid = () => (
    <View
      style={{
        width: 3 * (BOX_SIZE + BOX_MARGIN),
        height: 3 * (BOX_SIZE + BOX_MARGIN),
        alignSelf: 'center',
        marginBottom: 20,
      }}
    >
      {shuffleOrder.map((boxIdx, gridIdx) => (
        <Animated.View
          key={boxIdx}
          style={[
            styles.box,
            {
              position: 'absolute',
              ...anims[boxIdx].getLayout(),
              zIndex: selectedBox === gridIdx ? 2 : 1,
            },
            selectedBox === gridIdx && styles.selectedBox,
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => handleBoxSelect(gridIdx)}
            disabled={isShuffling || selectedBox !== null || isGettingReward}
            activeOpacity={0.8}
          >
            {openedBoxes[gridIdx] ? ( // If the box is opened, show its content
              <View style={styles.boxContent}>
                {openedBoxes[gridIdx].type === 'coins' ? (
                  <>
                    <Coins size={20} color={colors.accent} />
                    <Text style={styles.rewardText}>{openedBoxes[gridIdx].value}</Text>
                  </>
                ) : (
                  <>
                    {openedBoxes[gridIdx].imageUrl ? (
                      <Image
                        source={{ uri: openedBoxes[gridIdx].imageUrl }}
                        style={styles.assetImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Star size={20} color="#FFD700" />
                    )}
                    <Text style={styles.assetText} numberOfLines={2}>
                      {openedBoxes[gridIdx].value}
                    </Text>
                  </>
                )}
              </View>
            ) : ( // Otherwise, show the gift icon
              <Gift size={28} color={selectedBox === gridIdx ? colors.accent : colors.mutedText} />
            )}
          </TouchableOpacity>
        </Animated.View>
      ))}
      {isGettingReward && (
        <View style={styles.gettingRewardOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.gettingRewardText}>Getting your reward...</Text>
        </View>
      )}
    </View>
  );

  const getMultiplierText = () => {
    if (!reward || reward.type !== 'coins') return '';
    const multiplier = reward.value / parsedAmount;
    if (multiplier === 0) return 'Better luck next time!';
    return `${multiplier.toFixed(1)}x your bet!`;
  };

  if (loadingConfig) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Gift size={24} color={colors.accent} />
        <Text style={styles.title}>Lucky Box Game</Text>
      </View>
      {/* Current Balance Display */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Your Balance:</Text>
        <View style={styles.balanceDisplay}>
          <Text style={styles.balanceAmount}>{balance?.toLocaleString() || 0}</Text>
          <Image source={require('../../../assets/rupee.png')} style={styles.coinIcon} />
        </View>
      </View>
      {/* Amount Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Enter Amount to Play</Text>
        <Text style={styles.subtitle}>Win 0-5x your amount in coins or game assets!</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.amountInput}
            value={inputAmount}
            onChangeText={(text) => {
              let val = text.replace(/[^0-9]/g, '');
              if (val) {
                let numVal = parseInt(val);
                if (numVal > 7000) numVal = 7000;
                val = numVal.toString();
              }
              setInputAmount(val);
              setError(null);
            }}
            placeholder="Enter coins (min 50, max 7000)"
            placeholderTextColor={colors.mutedText}
            keyboardType="numeric"
          />
          <Image source={require('../../../assets/rupee.png')} style={styles.coinIcon} />
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {parsedAmount >= 50 && (
          <View style={styles.rewardPreview}>
            <Text style={styles.previewText}>
              Max Possible Reward: {(parsedAmount * (chancesConfig.maxRewardMultiplier ?? 5)).toLocaleString()} Coins
            </Text>
            {filteredAssets.length > 0 && (
              <Text style={styles.previewText}>
                + Chance for valuable game assets!
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.startButton,
            (parsedAmount < 50 || isStartingGame) && styles.startButtonDisabled,
          ]}
          onPress={handleStartGame}
          disabled={parsedAmount < 50 || isStartingGame}
        >
          {isStartingGame ? (
            <Text style={styles.startButtonText}>Starting Game...</Text>
          ) : (
            <>
              <Play size={20} color={colors.background} />
              <Text style={styles.startButtonText}>Start Game</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {/* Probability Info */}
      <View style={styles.probabilityContainer}>
        <Text style={styles.probabilityTitle}>
          Win Chance: <Text style={{ color: colors.accent }}>High!</Text>
        </Text>
        <Text style={styles.probabilityText}>Most players win 2x or more! Try your luck 🎉</Text>
      </View>
      {/* Available Assets Preview */}
      {gameAssets.length > 0 && (
        <View style={styles.assetsPreview}>
          <Text style={styles.sectionTitle}>All Game Assets ({gameAssets.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.assetsList}>
              {gameAssets.map((asset) => (
                <View key={asset.id} style={styles.assetPreviewCard}>
                  <Image
                    source={asset.imageUrl ? { uri: asset.imageUrl } : require('../../../assets/bat.png')}
                    style={styles.assetPreviewImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.assetPreviewTitle} numberOfLines={1}>
                    {asset.title}
                  </Text>
                  <Text style={styles.assetPreviewPrice}>{asset.price} coins</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      {/* Box Selection Modal */}
      <Modal transparent visible={showBoxSelection} animationType="fade" onRequestClose={resetGame}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Lucky Box ({parsedAmount} Coins)</Text>
              <TouchableOpacity onPress={resetGame} style={styles.closeButton}>
                <X size={24} color={colors.mutedText} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Max Reward: {maxReward.toLocaleString()} Coins
            </Text>

            {isShuffling && (
              <>
                <View style={styles.shufflingButton}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={styles.shufflingButtonText}>Shuffling...</Text>
                </View>
                <Video
                  source={{ uri: 'https://ik.imagekit.io/ypvwcoywn3/Moving%20around%20or%20shuffling%20sound%20effect%20%20%20(for%20animations).mp4?updatedAt=1749056364389' }}
                  audioOnly={true}
                  paused={!isShuffling}
                  repeat={true}
                  volume={1.0}
                  style={{ height: 0, width: 0 }}
                />
              </>
            )}

            {renderBoxGrid()}

            {selectedBox === null && !isShuffling && !isGettingReward && (
              <Text style={styles.instructionText}>Select a box to reveal your reward!</Text>
            )}
          </View>
        </View>
      </Modal>
      {/* Reward Modal */}
      <Modal transparent visible={showReward} animationType="fade" onRequestClose={resetGame}>
        <View style={styles.modalOverlay}>
          <View style={styles.rewardModal}>
            {showRewardText ? (
              <>
                <Text style={styles.congratsText}>
                  {reward?.type === 'coins' && reward?.value === 0 ? 'Better Luck Next Time!' : 'Congratulations! 🎉'}
                </Text>
                <Text style={styles.rewardIsThisText}>Your reward is:</Text>
                <View style={styles.rewardDisplay}>
                  {reward?.type === 'coins' ? (
                    <>
                      <Coins size={48} color={reward.value === 0 ? colors.mutedText : colors.accent} />
                      <Text style={[styles.rewardValue, reward.value === 0 && styles.zeroReward]}>
                        {reward.value.toLocaleString()} Coins
                      </Text>
                      <Text style={styles.rewardMultiplier}>{getMultiplierText()}</Text>
                    </>
                  ) : (
                    <>
                      {reward?.imageUrl ? (
                        <Image source={{ uri: reward.imageUrl }} style={styles.rewardAssetImage} resizeMode="cover" />
                      ) : (
                        <Star size={48} color="#FFD700" />
                      )}
                      <Text style={styles.rewardValue}>{reward?.value}</Text>
                      <Text style={styles.rewardMultiplier}>Worth {reward?.originalPrice} coins!</Text>
                      {reward?.achievementText && <Text style={styles.rewardDescription}>{reward.achievementText}</Text>}
                    </>
                  )}
                </View>
              </>
            ) : null}
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity
                style={[styles.playAgainButton, !rewardGiven && styles.startButtonDisabled]}
                onPress={resetGame}
                disabled={!rewardGiven}
              >
                <Text style={styles.playAgainText}>Play Again</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Modal>
      <InsufficientBalance visible={showInsufficientBalance} onClose={() => setShowInsufficientBalance(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.accent,
    marginLeft: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(58, 237, 118, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.mutedText,
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  inputSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: colors.accent,
    paddingVertical: 12,
  },
  coinIcon: {
    width: 20,
    height: 20,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 12,
  },
  rewardPreview: {
    backgroundColor: 'rgba(58, 237, 118, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 4,
  },
  startButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonDisabled: {
    backgroundColor: colors.mutedText,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  probabilityContainer: {
    backgroundColor: 'rgba(58, 237, 118, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  probabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
  },
  probabilityText: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 2,
  },
  assetsPreview: {
    marginBottom: 20,
  },
  assetsList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 4,
  },
  assetPreviewCard: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    padding: 8,
    width: 80,
    alignItems: 'center',
  },
  assetPreviewImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginBottom: 4,
  },
  assetPreviewTitle: {
    fontSize: 10,
    color: colors.accent,
    textAlign: 'center',
    marginBottom: 2,
  },
  assetPreviewPrice: {
    fontSize: 9,
    color: colors.mutedText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    width: '95%',
    maxWidth: 400,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  readyButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  shufflingButton: {
    backgroundColor: 'rgba(58, 237, 118, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  shufflingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBox: {
    backgroundColor: 'rgba(58, 237, 118, 0.2)',
    borderColor: colors.accent,
  },
  disabledBox: {
    opacity: 0.7,
  },
  boxContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 4,
  },
  assetText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 4,
    textAlign: 'center',
  },
  assetImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
  },
  rewardModal: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 10,
    textAlign: 'center',
  },
  rewardIsThisText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 20,
    textAlign: 'center',
  },
  rewardDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 12,
    textAlign: 'center',
  },
  zeroReward: {
    color: colors.mutedText,
  },
  rewardMultiplier: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
    textAlign: 'center',
  },
  rewardDescription: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 8,
    textAlign: 'center',
  },
  rewardAssetImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  playAgainButton: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  playAgainText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  gettingRewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  gettingRewardText: {
    marginTop: 12,
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CalendarCard;