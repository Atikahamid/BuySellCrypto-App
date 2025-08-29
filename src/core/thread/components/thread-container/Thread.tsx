import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Animated, NativeScrollEvent, NativeSyntheticEvent, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThreadComposer } from '../thread-composer/ThreadComposer';
import { getThreadBaseStyles, headerStyles, tabStyles } from './Thread.styles';
import { mergeStyles } from '../../utils';
import Icons from '../../../../assets/svgs';
import { ThreadProps } from '../../types';
import { ThreadItem } from '../thread-item/ThreadItem';
import { IPFSAwareImage, getValidImageSource } from '@/shared/utils/IPFSImage';
import { useAppSelector } from '@/shared/hooks/useReduxHooks';
import { DEFAULT_IMAGES } from '@/shared/config/constants';
import { Platform } from 'react-native';
import SearchScreen from '@/screens/sample-ui/Threads/SearchScreen';
import COLORS from '@/assets/colors';
import TYPOGRAPHY from '@/assets/typography';
import { NftListingModal } from '@/modules/nft';
import { useWallet } from '@/modules/wallet-providers';
// import { useFetchTokens, TokenInfo } from '@/modules/data-module';
import { fetchRecentSwaps, fetchRecentSwapsByHelius } from '@/modules/data-module';
// import User2 from '@/assets/images/User2.png';
import BarsBTN from '@/assets/svgs';
import ThunderBtn from '@/assets/svgs';
// import{ Trade, fetchPastTrades} from '../../../../shared/services/tradeService';
import socketService from '../../../../shared/services/socketService';
import { SERVER_URL } from '@env';
import { useTrades } from '../../hooks/useTrades';
import { formatTimeAgo } from '../../utils';
// interface Trade {
//   Block: { Time: string };
//   Trade: {
//     Currency: { Name: string; Symbol: string; MintAddress: string };
//     Amount: number;
//     Price: number;
//     PriceInUSD: number;
//     Side: { Type: string; Amount: number; AmountInUSD: number };
//     Account: { Address: string };
//   };
// }
export const Thread: React.FC<ThreadProps> = ({
  rootPosts,
  currentUser,
  showHeader = true,
  onPostCreated,
  hideComposer = false,
  onPressPost,
  ctaButtons,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh,
  onPressUser,
  disableReplies = false,
  scrollUI,
}) => {
  const trades = useTrades();
  // Local fallback for refreshing if not provided
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'aura'>('feed');
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);
  // const [liveTrades, setLiveTrades] = useState<any[]>([]);
  // const [swaps, setSwaps] = useState<SwapTransaction[]>([]);
  // const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  // small helpers
  const shortAddr = (a?: string) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : '—');

  const timeAgoFormat = (timestamp: string | number) => {
    const t = typeof timestamp === "number" ? timestamp * 1000 : Date.parse(timestamp);
    const diff = Math.max(0, Date.now() - t);
    const s = Math.floor(diff / 1000);

    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };
  const timeAgo = (timestamp: string | number) => {
    const [timeAgo, setTimeAgo] = useState(() => timeAgoFormat(timestamp));

    useEffect(() => {
      const interval = setInterval(() => {
        setTimeAgo(timeAgoFormat(timestamp));
      }, 1000); // update every second

      return () => clearInterval(interval);
    }, [timestamp]);

    return timeAgo;
  };

  // useEffect(() => {
  //   async function fetchPastTrades() {
  //     try {
  //       const res = await fetch(`${SERVER_URL}/api/pastTrades/past-trades`);
  //       const json = await res.json();
  //       const fetchedTrades = json?.data?.Solana?.DEXTradeByTokens ?? [];
  //       console.log("fetched trades: ", fetchedTrades);
  //       setTrades(fetchedTrades);
  //     } catch (err) {
  //       console.error("Error fetching past trades:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   fetchPastTrades();
  // }, []);
  useEffect(() => {
    let mounted = true;

    // ensure socket is connected (you can pass any stable string as userId for auth)
    socketService.initSocket('token_transfer');

    const onTrade = (trade: any) => {
      if (!mounted) return;
      const card = mapTradeToCard(trade);

      // de-dup by tx id if present, keep list reasonable
      setLiveTrades(prev => {
        if (trade.tx && prev.some(p => p.id === trade.tx)) return prev;
        const next = [card, ...prev];
        return next.slice(0, 200);
      });
    };

    socketService.subscribeToEvent('token_transfer', onTrade);
    return () => {
      mounted = false;
      socketService.unsubscribeFromEvent('token_transfer', onTrade);
    };
  }, []);

  // map backend trade → your card shape
  const mapTradeToCard = (t: any) => {
    const amount = typeof t.amount === 'number' ? t.amount : Number(t.amount || 0);
    const amountUsd = typeof t.amountUsd === 'number' ? t.amountUsd : Number(t.amountUsd || 0);
    const priceUsd = typeof t.priceUsd === 'number' ? t.priceUsd : Number(t.priceUsd || 0);

    return {
      id: t.tx || `${t.wallet}-${t.time}-${Math.random()}`,
      wallet: shortAddr(Array.isArray(t.wallet) ? t.wallet[0] : t.wallet),
      type: (t.action || 'TRADE').toUpperCase(),     // BUY/SELL/TRADE
      time: timeAgo(t.time),                         // e.g. "8m"
      token: t?.token?.symbol || t?.token?.name || '—',
      userPic: '',                                   // not available → fallback below
      tokenPic: t?.token?.metadata?.fetched?.image,                 // IPFS/HTTP, handled by IPFSAwareImage
      description: t?.token?.metadata?.fetched?.description,
      pnl: amountUsd ? `$${amountUsd.toFixed(2)}` : '-',
      pnlPercent: '',                                // unknown here
      marketCap: (t.dex || '').toUpperCase(),        // show DEX name instead
      sol: `${Number(t?.solSpent?.amount || 0).toFixed(4)} ${(t?.solSpent?.symbol || 'SOL')} • fee $${Number(t?.fee || 0).toFixed(4)}`
    };
  };
  // Scroll-based UI hiding state
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<'up' | 'down'>('up');
  const isUIHidden = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Animation values for hiding/showing UI elements
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const composerTranslateY = useRef(new Animated.Value(0)).current;
  const tabsTranslateY = useRef(new Animated.Value(0)).current;

  // Opacity values to handle visibility
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const composerOpacity = useRef(new Animated.Value(1)).current;
  const tabsOpacity = useRef(new Animated.Value(1)).current;

  // Get the stored profile pic from Redux
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);

  // 1. Get the base styles for this component (doesn't need theme argument anymore)
  const baseComponentStyles = getThreadBaseStyles();

  // 2. Use the utility function to merge base styles, overrides, and user sheet
  const styles = mergeStyles(baseComponentStyles, styleOverrides, userStyleSheet);

  // Local onRefresh if external prop is not provided
  const localOnRefresh = () => {
    setLocalRefreshing(true);
    setTimeout(() => {
      setLocalRefreshing(false);
    }, 800);
  };
  const feedDataToShowCard = [
    {
      id: '1',
      wallet: '0XGRIZZLYADAMZ',
      type: 'SELL',
      time: '8m',
      token: 'MEMEDOG',
      userPic: 'https://imagedelivery.net/WL1JOIJiM_NAChp6rtB6Cw/coin-image/5NDMGdsmb89BKiG8QgyX3diMGTh7QEY2nFMmB2jYpump/86x86?alpha=true',
      tokenPic: 'https://ipfs.io/ipfs/bafkreib764k6tm2yfbuugn3lj7kb6uacqpswe7rnjzspx6imwlonzqz7zi',
      description: 'Literally a ...',
      pnl: '-$19.75 PNL',
      pnlPercent: '↓88.51%',
      marketCap: '$49.23K MC',
      sol: '0.014 SOL at $42.53K market cap',
    },
    {
      id: '2',
      wallet: 'JACKY_20119',
      type: 'BUY',
      time: '8m',
      token: 'FWH',
      userPic: 'https://ipfs.io/ipfs/QmTdKwzGrGuNjt5bSEfmryuKH1R7FMyw2x1BLK3Cvuq7kt',
      tokenPic: 'https://ipfs.io/ipfs/bafybeidqi3mhchumeqyy7kxbrq7jbtubqdlvc7tukjfrqfkaalx2ssllam',
      description: 'Finn Wif Hat',
      pnl: '-$5.43 PNL',
      pnlPercent: '↓9.96%',
      marketCap: '$55.77K MC',
      sol: '0.15 SOL at $65.74K market cap',
    },
    {
      id: '3',
      wallet: '0XGRIZZLYADAMZ',
      type: 'SELL',
      time: '8m',
      token: 'MEMEDOG',
      userPic: 'https://ipfs.io/ipfs/QmeDkBx7VnBw9xsdE5XuWN4iREd3ZKjqpUAPPaeCaS5wMm',
      tokenPic: 'https://ipfs.io/ipfs/QmQSMu2LmqCBBUTMWQLGSCwgA47XjYWPvuHwfs2N2vvFmp',
      description: 'Literally a ...',
      pnl: '-$19.75 PNL',
      pnlPercent: '↓88.51%',
      marketCap: '$49.23K MC',
      sol: '0.014 SOL at $42.53K market cap',
    },
  ]
  //  const nftItems = [
  //       {
  //           mint: 'abc123',
  //           owner: 'user_public_key',
  //           priceSol: 0.5,
  //           name: 'My NFT #1',
  //           image: 'https://placekitten.com/200/200',
  //           collection: 'Kitty Collection',
  //           isCompressed: false,
  //       },
  //       {
  //           mint: 'def456',
  //           owner: 'user_public_key',
  //           priceSol: 1.2,
  //           name: 'My NFT #2',
  //           image: 'https://placekitten.com/201/201',
  //           collection: 'Kitty Collection',
  //           isCompressed: true,
  //       },
  //   ];

  // Function to handle NFT share
  // const handleShare = (data) => {
  //     console.log('NFT Shared:', data);
  // };
  const finalRefreshing =
    externalRefreshing !== undefined ? externalRefreshing : localRefreshing;
  const finalOnRefresh =
    externalOnRefresh !== undefined ? externalOnRefresh : localOnRefresh;

  const handleProfilePress = () => {
    navigation.navigate('ProfileScreen' as never);
  };

  // Handler for wallet icon press
  const handleWalletPress = () => {
    navigation.navigate('WalletScreen' as never);
  };

  // Hide UI elements
  const hideUI = useCallback(() => {
    if (isUIHidden.current) return;
    isUIHidden.current = true;

    console.log('🔽 Hiding UI elements');

    Animated.parallel([
      // Translate elements off screen
      Animated.timing(headerTranslateY, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(tabsTranslateY, {
        toValue: -48,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(composerTranslateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      // Fade out elements
      Animated.timing(headerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(tabsOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(composerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide tab bar if scrollUI is available
    if (scrollUI) {
      scrollUI.hideTabBar();
    }
  }, [headerTranslateY, tabsTranslateY, composerTranslateY, headerOpacity, tabsOpacity, composerOpacity, scrollUI]);

  // Show UI elements
  const showUI = useCallback(() => {
    if (!isUIHidden.current) return;
    isUIHidden.current = false;

    console.log('🔼 Showing UI elements');

    Animated.parallel([
      // Translate elements back to original position
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(tabsTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(composerTranslateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      // Fade in elements
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(tabsOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(composerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Show tab bar if scrollUI is available
    if (scrollUI) {
      scrollUI.showTabBar();
    }
  }, [headerTranslateY, tabsTranslateY, composerTranslateY, headerOpacity, tabsOpacity, composerOpacity, scrollUI]);

  // Handle scroll events for UI hiding/showing
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDiff = currentScrollY - lastScrollY.current;

    // Clear any existing timeout
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    // Don't trigger if scroll diff is too small (less than 3px)
    if (Math.abs(scrollDiff) < 3) {
      lastScrollY.current = currentScrollY;
      return;
    }

    const newDirection = scrollDiff > 0 ? 'down' : 'up';

    console.log(`📊 Scroll: ${currentScrollY.toFixed(1)}px, Diff: ${scrollDiff.toFixed(1)}px, Direction: ${newDirection}`);

    // Immediate actions based on scroll position and direction
    if (currentScrollY <= 20) {
      // At the very top - always show UI
      if (isUIHidden.current) {
        showUI();
      }
    } else if (newDirection === 'down' && currentScrollY > 50 && scrollDiff > 3) {
      // Scrolling down with enough momentum - hide UI
      if (!isUIHidden.current) {
        hideUI();
      }
    } else if (newDirection === 'up' && scrollDiff < -3) {
      // Scrolling up with enough momentum - show UI
      if (isUIHidden.current) {
        showUI();
      }
    }

    // Update stored values
    scrollDirection.current = newDirection;
    lastScrollY.current = currentScrollY;

    // Set a timeout to handle edge cases
    scrollTimeout.current = setTimeout(() => {
      if (currentScrollY <= 30 && isUIHidden.current) {
        showUI();
      }
    }, 100);
  }, [hideUI, showUI]);

  // Reset UI state when tab changes
  React.useEffect(() => {
    if (activeTab === 'feed') {
      showUI();
    }
  }, [activeTab, showUI]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <ThreadItem
      post={item}
      currentUser={currentUser}
      rootPosts={rootPosts}
      themeOverrides={themeOverrides}
      styleOverrides={styleOverrides}
      userStyleSheet={userStyleSheet}
      onPressPost={onPressPost}
      ctaButtons={ctaButtons}
      onPressUser={onPressUser}
      disableReplies={disableReplies}
    />
  );

  return (
    <View style={styles.threadRootContainer}>
      {showHeader && (
        <Animated.View
          style={[
            styles.header,
            { padding: 16 },
            {
              transform: [{ translateY: headerTranslateY }],
              opacity: headerOpacity,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: COLORS.backgroundGradient,
              height: 80, // Fixed height to prevent layout issues
            }
          ]}
        >
          <View style={headerStyles.container}>
            {/* Left: User Profile Image */}
            <TouchableOpacity onPress={handleProfilePress} style={headerStyles.profileContainer}>
              {/* <IPFSAwareImage
                source={
                  storedProfilePic
                    ? getValidImageSource(storedProfilePic)
                    : currentUser && 'avatar' in currentUser && currentUser.avatar
                      ? getValidImageSource(currentUser.avatar)
                      : DEFAULT_IMAGES.user
                }
                style={headerStyles.profileImage}
                defaultSource={DEFAULT_IMAGES.user}
                key={Platform.OS === 'android' ? `profile-${Date.now()}` : 'profile'}
              /> */}
              <Icons.SettingsIcon width={28} height={28} color={COLORS.white} />
            </TouchableOpacity>

            {/* Right: Copy and Wallet Icons */}
            <View style={headerStyles.iconsContainer}>
              {/* <TouchableOpacity
                style={headerStyles.iconButton}
                onPress={handleProfilePress}
                activeOpacity={0.7}
              >
                <Icons.MyWalletIcon width={28} height={28} color={COLORS.white} />
              </TouchableOpacity> */}
              <TouchableOpacity onPress={handleProfilePress} style={headerStyles.profileContainer}>
                <IPFSAwareImage
                  source={
                    storedProfilePic
                      ? getValidImageSource(storedProfilePic)
                      : currentUser && 'avatar' in currentUser && currentUser.avatar
                        ? getValidImageSource(currentUser.avatar)
                        : DEFAULT_IMAGES.user
                  }
                  style={headerStyles.profileImage}
                  defaultSource={DEFAULT_IMAGES.user}
                  key={Platform.OS === 'android' ? `profile-${Date.now()}` : 'profile'}
                />
                {/* <Icons.SettingsIcon width={28} height={28} color={COLORS.white} /> */}
              </TouchableOpacity>
            </View>

            {/* Center: App Logo - Using absolute positioning to keep centered */}
            <View style={headerStyles.absoluteLogoContainer}>
              {/* <Icons.AppLogo width={40} height={40} /> */}
              <Icons.AppLogo width={28} height={28} />
              {/* <Text style={{color: COLORS.greyLight}}>BAGS APP</Text> */}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Tab Slider */}
      <Animated.View
        style={[
          tabStyles.container,
          {
            transform: [{ translateY: tabsTranslateY }],
            opacity: tabsOpacity,
            position: 'absolute',
            top: showHeader ? 80 : 0,
            left: 0,
            right: 0,
            zIndex: 999,
            backgroundColor: COLORS.background,
            height: 30, // Fixed height to prevent layout issues
            width: 'auto',
            flexDirection: 'row',
            justifyContent: 'space-evenly',
          }
        ]}
      >
        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'feed' && tabStyles.activeTab]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={[tabStyles.tabText, activeTab === 'feed' && tabStyles.activeTabText]}>
            My Feed
          </Text>
          {activeTab === 'feed' && <View style={tabStyles.indicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'aura' && tabStyles.activeTab]}
          onPress={() => setActiveTab('aura')}
        >
          <Text style={[tabStyles.tabText, activeTab === 'aura' && tabStyles.activeTabText]}>
            Assets
          </Text>
          {activeTab === 'aura' && <View style={tabStyles.indicator} />}
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'completing' && tabStyles.activeTab]}
          onPress={() => setActiveTab('completing')}
        >
          <Text style={[tabStyles.tabText, activeTab === 'completing' && tabStyles.activeTabText]}>
            Completing
          </Text>
          {activeTab === 'completing' && <View style={tabStyles.indicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'completed' && tabStyles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[tabStyles.tabText, activeTab === 'completed' && tabStyles.activeTabText]}>
            Completed
          </Text>
          {activeTab === 'completed' && <View style={tabStyles.indicator} />}
        </TouchableOpacity> */}

        {/* <TouchableOpacity
          style={[tabStyles.tab, activeTab === 'search' && tabStyles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Icons.searchIcon
            width={24}
            height={24}
            color={activeTab === 'search' ? COLORS.brandBlue : COLORS.greyMid}
          />
          {activeTab === 'search' && <View style={tabStyles.indicator} />}
        </TouchableOpacity> */}

        {/* Bottom gradient border */}
        <LinearGradient
          colors={['transparent', COLORS.lightBackground]}
          style={tabStyles.bottomGradient}
        />
      </Animated.View>

      {activeTab === 'feed' && (
        <View style={{ flex: 1, paddingTop: showHeader ? 136 : 80 }} >
          <FlatList
            data={trades}
            keyExtractor={(item, index) =>
              `${item.walletAddress}-${item.time}-${item.token.mintAddress || index}`
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* Top row */}
                <View style={styles.topRow}>
                  <View style={styles.userInfo}>
                    <IPFSAwareImage
                      source={getValidImageSource(item.userProfilePic)}
                      style={styles.userIcon}
                      defaultSource={DEFAULT_IMAGES.user}
                      key={Platform.OS === 'android' ? `user-${item.token.mintAddress}` : 'user'}
                    />
                    <View style={styles.userDetails}>
                      <View style={styles.walletAndTag}>
                        <Text style={styles.wallet}>{item.username}</Text>
                        <View style={[styles.tag, item.action === 'buy' ? styles.buyTag : styles.sellTag]}>
                          <Text style={styles.tagText}>{item.action}</Text>
                        </View>
                      </View>
                      <Text style={styles.sol}>{Number(item.solPrice).toFixed(2)} SOL at ${item.marketCapAtTrade}K market cap</Text>
                    </View>
                  </View>
                  <Text style={styles.time}>{formatTimeAgo(item.time)}</Text>
                </View>


                {/* Token row */}
                <View style={styles.upperMiddleRow}>
                  <View style={styles.middleRow}>
                    <View style={styles.tokenInfo}>
                      <IPFSAwareImage
                        source={getValidImageSource(item.token.imageUrl)}
                        style={styles.tokenIcon}
                        defaultSource={DEFAULT_IMAGES.token}
                        key={Platform.OS === 'android' ? `token-${item.token.mintAddress}` : 'token'}
                      />
                      <View style={{ gap: 4 }}>
                        <Text style={styles.token}>{item.token.symbol}</Text>
                        <Text style={styles.description}>{item.token.name}</Text>
                      </View>
                    </View>
                    <View style={styles.pnlBoxOuter}>
                      <View style={styles.pnlBox}>
                        <Text style={styles.pnl}>{item.pnl}</Text>
                        <Text style={styles.pnlPercent}>{item.pnl}</Text>
                      </View>
                      <Text style={styles.marketCap}>{item.currentMarketCap} MC</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.button} onPress={() => console.log("hi")}>
                    <View style={styles.content}>
                      {/* Left SVG */}
                      <Icons.ThunderBtn width={15} height={15} />
                      {/* Title */}
                      <Text style={styles.text}>1.00</Text>
                      <Icons.BarsBTN width={20} height={20} />
                      {/* Right SVG */}
                      {/* <SvgXml xml={`<svg ... />`} width={20} height={20} /> */}
                    </View>
                  </TouchableOpacity>
                </View>




              </View>
            )}
            
          />
        </View>

        // <View style={{ flex: 1 }}>
        //   {/* <NftListingModal
        //     visible={showModal}
        //     onClose={() => setShowModal(false)}
        //     onShare={handleShare}
        //     listingItems={nftItems}
        //     loadingListings={false}
        //     fetchNftsError={null} /> */}
        //   {/* {!hideComposer && (
        //     <Animated.View
        //       style={{
        //         transform: [{ translateY: composerTranslateY }],
        //         opacity: composerOpacity,
        //         position: 'absolute',
        //         top: showHeader ? 128 : 48,
        //         left: 0,
        //         right: 0,
        //         zIndex: 998,
        //         backgroundColor: COLORS.background,
        //         minHeight: 120, // Fixed minimum height to prevent layout issues
        //       }}
        //     >
        //       {/* <ThreadComposer
        //         currentUser={currentUser}
        //         onPostCreated={onPostCreated}
        //         themeOverrides={themeOverrides}
        //         styleOverrides={styleOverrides}
        //       /> */}
        //   {/* </Animated.View>
        //   )} */}

        //   <FlatList
        //     data={rootPosts}
        //     renderItem={renderItem}
        //     keyExtractor={(item) => item.id}
        //     contentContainerStyle={[
        //       styles.threadListContainer,
        //       {
        //         paddingTop: !hideComposer
        //           ? (showHeader ? 248 : 168) // Header(80) + Tabs(48) + Composer(120) + minimal spacing
        //           : (showHeader ? 128 : 48), // Header(80) + Tabs(48) OR just Tabs(48)
        //       }
        //     ]}
        //     refreshing={finalRefreshing}
        //     onRefresh={finalOnRefresh}
        //     onScroll={handleScroll}
        //     scrollEventThrottle={16}
        //     showsVerticalScrollIndicator={false}
        //   />
        // </View>

        // <View>
        //   <Button title="Refresh Tokens" onPress={refetch} />
        //   <FlatList
        //     data={tokens}
        //     keyExtractor={(item: TokenInfo) => item.address}
        //     renderItem={({ item }) => (
        //       <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        //         {item.logoURI && <Image source={{ uri: item.logoURI }} style={{ width: 30, height: 30, marginRight: 10 }} />}
        //         <Text>{item.name} ({item.symbol})</Text>
        //         {/* You would typically fetch and display balance separately or enhance TokenInfo */}
        //       </View>
        //     )}
        //   />
        // </View>
      )
      }

      {
        activeTab === 'aura' && (
          <View style={{ flex: 1, paddingTop: showHeader ? 136 : 80 }}>
            <SearchScreen showHeader={false} />
          </View>
          // <View style={{ flex: 1 }}>
          //   {!hideComposer && (
          //     <Animated.View
          //       style={{
          //         transform: [{ translateY: composerTranslateY }],
          //         opacity: composerOpacity,
          //         position: 'absolute',
          //         top: showHeader ? 128 : 48,
          //         left: 0,
          //         right: 0,
          //         zIndex: 998,
          //         backgroundColor: COLORS.background,
          //         minHeight: 120, // Fixed minimum height to prevent layout issues
          //       }}
          //     >
          //       <ThreadComposer
          //         currentUser={currentUser}
          //         onPostCreated={onPostCreated}
          //         themeOverrides={themeOverrides}
          //         styleOverrides={styleOverrides}
          //       />
          //     </Animated.View>
          //   )}

          //   <FlatList
          //     data={rootPosts}
          //     renderItem={renderItem}
          //     keyExtractor={(item) => item.id}
          //     contentContainerStyle={[
          //       styles.threadListContainer,
          //       {
          //         paddingTop: !hideComposer
          //           ? (showHeader ? 248 : 168) // Header(80) + Tabs(48) + Composer(120) + minimal spacing
          //           : (showHeader ? 128 : 48), // Header(80) + Tabs(48) OR just Tabs(48)
          //       }
          //     ]}
          //     refreshing={finalRefreshing}
          //     onRefresh={finalOnRefresh}
          //     onScroll={handleScroll}
          //     scrollEventThrottle={16}
          //     showsVerticalScrollIndicator={false}
          //   />
          // </View>
        )
      }

      {/* {
        activeTab === 'completing' && (
          <View style={{ flex: 1, paddingTop: showHeader ? 136 : 80 }}>
            <SearchScreen showHeader={false} />
          </View>
          // <View style={{ flex: 1 }}>
          //   {!hideComposer && (
          //     <Animated.View
          //       style={{
          //         transform: [{ translateY: composerTranslateY }],
          //         opacity: composerOpacity,
          //         position: 'absolute',
          //         top: showHeader ? 128 : 48,
          //         left: 0,
          //         right: 0,
          //         zIndex: 998,
          //         backgroundColor: COLORS.background,
          //         minHeight: 120, // Fixed minimum height to prevent layout issues
          //       }}
          //     >
          //       <ThreadComposer
          //         currentUser={currentUser}
          //         onPostCreated={onPostCreated}
          //         themeOverrides={themeOverrides}
          //         styleOverrides={styleOverrides}
          //       />
          //     </Animated.View>
          //   )}

          //   <FlatList
          //     data={rootPosts}
          //     renderItem={renderItem}
          //     keyExtractor={(item) => item.id}
          //     contentContainerStyle={[
          //       styles.threadListContainer,
          //       {
          //         paddingTop: !hideComposer
          //           ? (showHeader ? 248 : 168) // Header(80) + Tabs(48) + Composer(120) + minimal spacing
          //           : (showHeader ? 128 : 48), // Header(80) + Tabs(48) OR just Tabs(48)
          //       }
          //     ]}
          //     refreshing={finalRefreshing}
          //     onRefresh={finalOnRefresh}
          //     onScroll={handleScroll}
          //     scrollEventThrottle={16}
          //     showsVerticalScrollIndicator={false}
          //   />
          // </View>
        )
      } 

      {
        activeTab === 'completed' && (
          <View style={{ flex: 1, paddingTop: showHeader ? 136 : 80 }}>
            <SearchScreen showHeader={false} />
          </View>
          // <View style={{ flex: 1 }}>
          //   {!hideComposer && (
          //     <Animated.View
          //       style={{
          //         transform: [{ translateY: composerTranslateY }],
          //         opacity: composerOpacity,
          //         position: 'absolute',
          //         top: showHeader ? 128 : 48,
          //         left: 0,
          //         right: 0,
          //         zIndex: 998,
          //         backgroundColor: COLORS.background,
          //         minHeight: 120, // Fixed minimum height to prevent layout issues
          //       }}
          //     >
          //       <ThreadComposer
          //         currentUser={currentUser}
          //         onPostCreated={onPostCreated}
          //         themeOverrides={themeOverrides}
          //         styleOverrides={styleOverrides}
          //       />
          //     </Animated.View>
          //   )}

          //   <FlatList
          //     data={rootPosts}
          //     renderItem={renderItem}
          //     keyExtractor={(item) => item.id}
          //     contentContainerStyle={[
          //       styles.threadListContainer,
          //       {
          //         paddingTop: !hideComposer
          //           ? (showHeader ? 248 : 168) // Header(80) + Tabs(48) + Composer(120) + minimal spacing
          //           : (showHeader ? 128 : 48), // Header(80) + Tabs(48) OR just Tabs(48)
          //       }
          //     ]}
          //     refreshing={finalRefreshing}
          //     onRefresh={finalOnRefresh}
          //     onScroll={handleScroll}
          //     scrollEventThrottle={16}
          //     showsVerticalScrollIndicator={false}
          //   />
          // </View>
        )
      } */}
    </View >
  );
}

// Also export as default for backward compatibility
export default Thread;
