/*
* =======================================================================
* SIMPLE CLEAN ROCKET RIDE GAME - MINIMAL ANIMATIONS
* =======================================================================
*
* FEATURES:
* - Simple rocket movement up only
* - Clean minimal animations
* - Cashout button outside game screen
* - No complex camera movements
*
* =======================================================================
*/

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Animated, Easing, Dimensions } from 'react-native';
import { Gamepad2, Play, Wallet, Repeat, Star } from 'lucide-react-native';
import { useUser } from '../../context/UserContext';
import { colors } from '../../screens/theme';
import { savePurchaseHistory, getPurchaseHistory, getRocketRideConfig } from '../../config/firebase';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Default configuration values (fallback)
const DEFAULT_CONFIG = {
    minBet: 10,
    maxBet: 10000,
    maxMultiplier: 7.0,
    houseEdge: 0.08,
    clickProtectionDelay: 1000,
    minGameDuration: 1500,
    starCount: 30
};

// True Random Crash Generation (0-7x only)
const generateHardCrash = (houseEdge = 0.08) => {
    const baseRandom = Math.random();
    const houseAdjusted = baseRandom * (1 - houseEdge);

    if (houseAdjusted < 0.18) return 1.00;
    if (houseAdjusted < 0.55) return parseFloat((1.01 + (Math.random() * 0.49)).toFixed(2));
    if (houseAdjusted < 0.78) return parseFloat((1.51 + (Math.random() * 0.99)).toFixed(2));
    if (houseAdjusted < 0.90) return parseFloat((2.51 + (Math.random() * 1.49)).toFixed(2));
    if (houseAdjusted < 0.96) return parseFloat((4.01 + (Math.random() * 1.99)).toFixed(2));

    return parseFloat((6.01 + (Math.random() * 0.99)).toFixed(2));
};

// Simple Stars Background
const SimpleStarsBackground = ({ isRising, starCount = 30 }) => {
    const stars = useMemo(() =>
        Array.from({ length: starCount }).map((_, i) => ({
            left: Math.random() * SCREEN_WIDTH,
            top: Math.random() * SCREEN_HEIGHT,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.8 + 0.2
        })), [starCount]
    );

    const twinkleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRising) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(twinkleAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    }),
                    Animated.timing(twinkleAnim, {
                        toValue: 0,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    })
                ])
            ).start();
        } else {
            twinkleAnim.stopAnimation();
        }
    }, [isRising]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {stars.map((star, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.star,
                        {
                            left: star.left,
                            top: star.top,
                            width: star.size,
                            height: star.size,
                            borderRadius: star.size / 2,
                            backgroundColor: '#FFFFFF',
                            opacity: twinkleAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [star.opacity * 0.5, star.opacity]
                            })
                        }
                    ]}
                />
            ))}
        </View>
    );
};

// Simple Rocket Component
const SimpleRocket = ({ position, flame, gameState }) => {
    // Simple rocket movement - only goes up
    const rocketY = position.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -SCREEN_HEIGHT * 1.2], // Goes beyond screen
        extrapolate: 'repeat' // Magic! Creates seamless loop
    });

    const flameY = position.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, -SCREEN_HEIGHT * 0.6 - 50], // Flame follows rocket
        extrapolate: 'clamp'
    });

    return (
        <>
            {/* Simple Flame */}
            <Animated.View
                style={[
                    styles.flameContainer,
                    {
                        transform: [{ translateY: flameY }]
                    }
                ]}
            >
                <Animated.Image
                    source={require('../../../assets/flame.png')}
                    style={[
                        styles.rocketFlame,
                        {
                            opacity: flame
                        }
                    ]}
                />
            </Animated.View>

            {/* Simple Rocket */}
            <Animated.View
                style={[
                    styles.rocketContainer,
                    {
                        transform: [{ translateY: rocketY }]
                    }
                ]}
            >
                <Image
                    source={require('../../../assets/rocket.png')}
                    style={styles.rocket}
                />
            </Animated.View>
        </>
    );
};

// Main Game Component
const RocketRideGame = () => {
    const { user, subtractBalance, saveGameHistory, addBalance, hasSufficientBalance } = useUser();

    // Configuration state
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [configLoaded, setConfigLoaded] = useState(false);

    // Core Game State
    const [betAmount, setBetAmount] = useState('100');
    const [error, setError] = useState('');
    const [gameState, setGameState] = useState('betting');
    const [multiplier, setMultiplier] = useState(1.00);
    const [crashPoint, setCrashPoint] = useState(1.0);
    const [winnings, setWinnings] = useState(0);
    const [potentialWinnings, setPotentialWinnings] = useState(0);
    const [gameStartTime, setGameStartTime] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [userHistory, setUserHistory] = useState([]);

    // Simple Animation Refs
    const intervalRef = useRef(null);
    const gameStateRef = useRef(gameState);
    const rocketPosition = useRef(new Animated.Value(0)).current;
    const explosionOpacity = useRef(new Animated.Value(0)).current;
    const multiplierScale = useRef(new Animated.Value(1)).current;
    const impactFlashOpacity = useRef(new Animated.Value(0)).current;
    const winningsTextAnim = useRef(new Animated.Value(0)).current;
    const rocketFlame = useRef(new Animated.Value(0)).current;

    // Load configuration
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const cfg = await getRocketRideConfig();
                if (cfg) {
                    setConfig({ ...DEFAULT_CONFIG, ...cfg });
                }
            } catch (error) {
                console.warn('Failed to load config, using defaults:', error);
            } finally {
                setConfigLoaded(true);
            }
        };
        loadConfig();
    }, []);

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    // Load user history
    useEffect(() => {
        const loadHistory = async () => {
            if (user?.email) {
                try {
                    const history = await getPurchaseHistory(user.email);
                    setUserHistory(history || []);
                } catch (error) {
                    console.warn('Failed to load user history:', error);
                    setUserHistory([]);
                }
            }
        };
        loadHistory();
    }, [user]);

    const cleanupGame = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        rocketPosition.stopAnimation();
        multiplierScale.stopAnimation();
        rocketFlame.stopAnimation();
    };

    const resetGame = () => {
        cleanupGame();
        rocketPosition.setValue(0);
        explosionOpacity.setValue(0);
        impactFlashOpacity.setValue(0);
        winningsTextAnim.setValue(0);
        rocketFlame.setValue(0);
        setGameState('betting');
        setMultiplier(1.00);
        setError('');
        setWinnings(0);
        setPotentialWinnings(0);
    };

    // Bet Handler
    const handlePlaceBet = async () => {
        if (!configLoaded) {
            setError('Game is loading, please wait...');
            return;
        }

        const now = Date.now();
        if (now - lastClickTime < config.clickProtectionDelay) {
            setError('Please wait before placing another bet.');
            return;
        }
        setLastClickTime(now);

        const bet = parseInt(betAmount);
        if (!bet || bet < config.minBet || bet > config.maxBet) {
            setError(`Bet must be between ${config.minBet} and ${config.maxBet}.`);
            return;
        }
        if (!hasSufficientBalance(bet)) {
            setError('Insufficient balance.');
            return;
        }

        setError('');

        try {
            await subtractBalance(bet);

            const newCrashPoint = generateHardCrash(config.houseEdge);
            setCrashPoint(newCrashPoint);
            setGameState('waiting');
            setGameStartTime(now);

            console.log(`New Game: Crash at ${newCrashPoint}x`);

            setTimeout(() => setGameState('rising'), 1500);
        } catch (error) {
            setError('Failed to place bet. Please try again.');
            console.error('Bet placement error:', error);
        }
    };

    const handleCashOut = async () => {
        const now = Date.now();
        if (gameStateRef.current !== 'rising') return;
        if (now - gameStartTime < config.minGameDuration) return;

        cleanupGame();
        setGameState('cashed_out');

        const finalWinnings = Math.floor(potentialWinnings);
        setWinnings(finalWinnings);

        try {
            await addBalance(finalWinnings);

            const gameData = {
                gameType: 'RocketRide',
                amount: parseInt(betAmount),
                reward: {
                    type: 'coins',
                    value: finalWinnings,
                    cashedAt: multiplier
                },
                title: `Cashed out at ${multiplier.toFixed(2)}x`
            };

            const savedEntry = await saveGameHistory(gameData);
            setUserHistory(prev => [savedEntry, ...prev]);
        } catch (error) {
            console.error('Cash out error:', error);
        }

        Animated.spring(winningsTextAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true
        }).start();
    };

    // Simple Game Loop
    useEffect(() => {
        if (gameState === 'rising') {
            // Simple rocket animation - slow and steady
            Animated.timing(rocketPosition, {
                toValue: 1,
                duration: 30000, // Slower movement - 30 seconds
                easing: Easing.out(Easing.quad),
                useNativeDriver: true
            }).start();

            // Simple flame animation
            Animated.timing(rocketFlame, {
                toValue: 1,
                duration: 300,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true
            }).start();

            // Simple multiplier pulse
            Animated.loop(
                Animated.sequence([
                    Animated.timing(multiplierScale, {
                        toValue: 1.05,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    }),
                    Animated.timing(multiplierScale, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    })
                ])
            ).start();

            let currentMultiplier = 1.00;
            const gameSpeed = 100; // Slower game speed

            intervalRef.current = setInterval(() => {
                currentMultiplier += 0.01;

                if (currentMultiplier >= crashPoint) {
                    cleanupGame();
                    setMultiplier(crashPoint);
                    setGameState('crashed');

                    Animated.parallel([
                        Animated.timing(explosionOpacity, {
                            toValue: 1,
                            duration: 300,
                            easing: Easing.out(Easing.quad),
                            useNativeDriver: true
                        }),
                        Animated.sequence([
                            Animated.timing(impactFlashOpacity, {
                                toValue: 0.8,
                                duration: 150,
                                easing: Easing.out(Easing.quad),
                                useNativeDriver: true
                            }),
                            Animated.timing(impactFlashOpacity, {
                                toValue: 0,
                                duration: 400,
                                easing: Easing.out(Easing.quad),
                                useNativeDriver: true
                            })
                        ])
                    ]).start();
                } else {
                    setMultiplier(parseFloat(currentMultiplier.toFixed(2)));
                    setPotentialWinnings(parseInt(betAmount) * currentMultiplier);
                }
            }, gameSpeed);
        }

        return () => cleanupGame();
    }, [gameState, crashPoint]);

    // Show loading state if config not loaded
    if (!configLoaded) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Gamepad2 size={24} color={colors.accent} />
                    <Text style={styles.title}>Rocket Ride</Text>
                    <Star size={20} color="#FFD700" />
                </View>
                <Text style={styles.subtitle}>Loading game...</Text>
            </View>
        );
    }

    // UI Components
    const bettingUI = (
        <>
            <Text style={styles.sectionTitle}>Place Your Bet</Text>
            <Text style={styles.hardModeText}>💀 ULTRA HARD • Max {config.maxMultiplier}x • {Math.round(config.houseEdge * 100)}% House Edge</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.amountInput}
                    value={betAmount}
                    onChangeText={(text) => {
                        setBetAmount(text.replace(/[^0-9]/g, ''));
                        setError('');
                    }}
                    placeholder={`Bet (${config.minBet} - ${config.maxBet})`}
                    placeholderTextColor={colors.mutedText}
                    keyboardType="numeric"
                />
                <Image source={require('../../../assets/rupee.png')} style={styles.coinIcon} />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity style={styles.actionButton} onPress={handlePlaceBet}>
                <Play size={20} color={colors.background} />
                <Text style={styles.buttonText}>Place Bet</Text>
            </TouchableOpacity>
            <Text style={styles.statsText}>
                Recent Games: {userHistory.slice(0, 5).map(game =>
                    game.reward ? `${game.reward.cashedAt?.toFixed(2) || '1.00'}x` : '1.00x'
                ).join(' • ')}
            </Text>
        </>
    );

    const gameUI = (
        <>
            {/* Game Screen */}
            <View style={styles.gameArea}>
                {/* Simple Background */}
                <View style={styles.simpleBg} />

                <SimpleStarsBackground
                    isRising={gameState === 'rising'}
                    starCount={config.starCount}
                />

                {/* Simple Rocket */}
                <SimpleRocket
                    position={rocketPosition}
                    flame={rocketFlame}
                    gameState={gameState}
                />

                <Animated.Image
                    source={require('../../../assets/explosion.png')}
                    style={[styles.explosion, { opacity: explosionOpacity }]}
                />

                <View style={styles.multiplierContainer}>
                    {gameState === 'rising' && (
                        <Animated.Text style={[
                            styles.multiplierText,
                            {
                                color: multiplier >= 3 ? '#FFD700' : multiplier >= 2 ? '#FFC107' : 'white',
                                transform: [{ scale: multiplierScale }]
                            }
                        ]}>
                            {multiplier.toFixed(2)}x
                        </Animated.Text>
                    )}
                    {gameState === 'crashed' && (
                        <Text style={[styles.multiplierText, { color: colors.error }]}>
                            Crashed @ {crashPoint.toFixed(2)}x
                        </Text>
                    )}
                    {gameState === 'waiting' && (
                        <Text style={styles.multiplierText}>Launching...</Text>
                    )}
                    {gameState === 'cashed_out' && (
                        <>
                            <Text style={styles.cashedOutText}>Cashed Out!</Text>
                            <Text style={[
                                styles.multiplierText,
                                {
                                    color: multiplier >= 5 ? '#FFD700' : colors.accent,
                                    fontSize: 44
                                }
                            ]}>
                                {multiplier.toFixed(2)}x
                            </Text>
                            <Animated.View style={{
                                opacity: winningsTextAnim,
                                transform: [{ scale: winningsTextAnim }]
                            }}>
                                <Text style={styles.winningsText}>
                                    You won {winnings.toLocaleString()} coins!
                                </Text>
                            </Animated.View>
                        </>
                    )}
                </View>

                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        styles.flashOverlay,
                        { opacity: impactFlashOpacity }
                    ]}
                    pointerEvents="none"
                />
            </View>

            {/* Controls Outside Game Screen */}
            <View style={styles.controlsContainer}>
                {gameState === 'rising' && (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.cashOutButton,
                            multiplier >= 3 && styles.goldenButton
                        ]}
                        onPress={handleCashOut}
                    >
                        <Wallet size={20} color={colors.background} />
                        <Text style={styles.buttonText}>
                            Cash Out ({Math.floor(potentialWinnings)})
                        </Text>
                    </TouchableOpacity>
                )}
                {(gameState === 'crashed' || gameState === 'cashed_out') && (
                    <TouchableOpacity style={styles.actionButton} onPress={resetGame}>
                        <Repeat size={20} color={colors.background} />
                        <Text style={styles.buttonText}>Play Again</Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Gamepad2 size={24} color={colors.accent} />
                <Text style={styles.title}>Rocket Ride</Text>
                <Star size={20} color="#FFD700" />
            </View>
            <Text style={styles.subtitle}>
                Cash out before the rocket crashes! Max multiplier: {config.maxMultiplier.toFixed(1)}x
            </Text>
            {gameState === 'betting' ? bettingUI : gameUI}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: colors.backgroundLight,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(58, 237, 118, 0.2)',
        marginBottom: 20
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        gap: 8
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.accent,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 14,
        color: colors.mutedText,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: '500'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.accent,
        marginBottom: 8,
        textAlign: 'center'
    },
    hardModeText: {
        fontSize: 12,
        color: '#FF6B35',
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: 'bold',
        letterSpacing: 0.5
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.accent,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 8
    },
    amountInput: {
        flex: 1,
        fontSize: 16,
        color: colors.accent,
        paddingVertical: 12,
        textAlign: 'center'
    },
    coinIcon: {
        width: 20,
        height: 20
    },
    errorText: {
        fontSize: 12,
        color: colors.error,
        marginBottom: 8,
        textAlign: 'center',
        fontWeight: '500'
    },
    statsText: {
        fontSize: 11,
        color: colors.mutedText,
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic'
    },
    actionButton: {
        backgroundColor: colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8
    },
    cashOutButton: {
        backgroundColor: '#FFC107',
        shadowColor: '#FFC107',
        shadowOpacity: 0.4
    },
    goldenButton: {
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOpacity: 0.6
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.background
    },
    gameArea: {
        height: 350, // Reduced height
        backgroundColor: '#0a0820',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        borderWidth: 2,
        borderColor: 'rgba(58, 237, 118, 0.3)',
        marginBottom: 16 // Space for controls below
    },
    simpleBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: 16
    },
    star: {
        position: 'absolute'
    },
    rocketContainer: {
        position: 'absolute',
        bottom: 60,
        alignSelf: 'center',
        zIndex: 10
    },
    rocket: {
        width: 50,
        height: 100,
        resizeMode: 'contain'
    },
    flameContainer: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        zIndex: 9
    },
    rocketFlame: {
        width: 50,
        height: 100,
        resizeMode: 'contain'
    },
    explosion: {
        width: 120,
        height: 120,
        position: 'absolute',
        alignSelf: 'center',
        top: '35%',
        resizeMode: 'contain',
        zIndex: 20
    },
    multiplierContainer: {
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 30
    },
    multiplierText: {
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(58, 237, 118, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
        letterSpacing: 1
    },
    cashedOutText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textShadowColor: 'rgba(58, 237, 118, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8
    },
    winningsText: {
        fontSize: 16,
        color: 'white',
        marginTop: 8,
        fontWeight: '600',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3
    },
    controlsContainer: {
        // Controls outside game screen
        paddingTop: 8
    },
    flashOverlay: {
        backgroundColor: 'white',
        zIndex: 200
    }
});

export default RocketRideGame;