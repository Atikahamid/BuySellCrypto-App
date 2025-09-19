import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getThreadBaseStyles, headerStyles } from './Thread.styles';
import { mergeStyles } from '../../utils';
import Icons from '../../../../assets/svgs';
import { ThreadProps } from '../../types';
import { IPFSAwareImage, getValidImageSource } from '@/shared/utils/IPFSImage';
import { useAppSelector } from '@/shared/hooks/useReduxHooks';
import { DEFAULT_IMAGES } from '@/shared/config/constants';
import COLORS from '@/assets/colors';
import { useTrades } from '../../hooks/useTrades';
import { formatTimeAgo } from '../../utils';
import { formatCompactNumber } from '@/screens/sample-ui/Threads/SearchScreen';
import SearchBox from '@/screens/sample-ui/Threads/SearchBox';

export const Thread: React.FC<ThreadProps> = ({
  rootPosts,
  currentUser,
  showHeader = true,
  themeOverrides,
  styleOverrides,
  userStyleSheet,
}) => {
  const trades = useTrades();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);

  const baseComponentStyles = getThreadBaseStyles();
  const styles = mergeStyles(baseComponentStyles, styleOverrides, userStyleSheet);

  // animations (header only now)
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  const handleProfilePress = () => {
    navigation.navigate('TokenDetailScreen' as never);
  };
  

  return (
    <View style={styles.threadRootContainer}>
      {showHeader && (
        <Animated.View
          style={[
            styles.header,
            { padding: 16 },
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              backgroundColor: COLORS.backgroundGradient,
              height: 80,
              // borderWidth: 2,
              borderBottomColor: COLORS.backgroundGradient
            },
          ]}
        >
          <View style={headerStyles.container}>
            {/* Left */}
            <TouchableOpacity onPress={handleProfilePress} style={headerStyles.profileContainer}>
              <Icons.SettingsIcon width={28} height={28} color={COLORS.white} />
            </TouchableOpacity>

            {/* Right */}
            <View style={headerStyles.iconsContainer}>
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
              </TouchableOpacity>
            </View>

            {/* Center Logo */}
            <View style={headerStyles.absoluteLogoContainer}>
              <Icons.AppLogo width={28} height={28} />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Feed only */}
      <View style={{ flex: 1, paddingTop: showHeader ? 70 : 80 }}>
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
                    <Text style={styles.sol}>{Number(item.solPrice).toFixed(2)} SOL at ${formatCompactNumber(item.marketCapAtTrade)} market cap</Text>
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
                      <Text style={styles.description} numberOfLines={1}           // ✅ restrict to 1 line
                        ellipsizeMode="tail">{item.token.name}</Text>
                    </View>
                  </View>
                  <View style={styles.pnlBoxOuter}>
                    <View style={styles.pnlBox}>
                      <Text
                        style={[
                          styles.pnl,
                          { color: item.priceChange24h < 0 ? "#FF4C4C" : "#4CAF50" },
                        ]}
                      >
                        ${item.pnl} PNL
                      </Text>

                      <Text
                        style={[
                          styles.pnlPercent,
                          { color: item.priceChange24h < 0 ? "#FF4C4C" : "#4CAF50" },
                        ]}
                      >
                        {item.priceChange24h < 0 ? "↓ " : "↑ "}
                        {item.priceChange24h.toFixed(1)}%
                      </Text>
                    </View>

                    <Text style={styles.marketCap}>
                      ${formatCompactNumber(item.currentMarketCap)} MC
                    </Text>
                  </View>

                </View>
                <TouchableOpacity style={styles.button} onPress={() => console.log("hi")}>
                  <View style={styles.content}>
                    <Icons.ThunderBtn width={15} height={15} />
                    <Text style={styles.text}>1.00</Text>
                    <Icons.BarsBTN width={20} height={20} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
        <View style={styles.fixedSearch}>
          <SearchBox
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search tokens..."
          />
        </View>
      </View>
    </View>
  );
};

export default Thread;
