 <View style={[
            styles.searchContainer,
            Platform.OS === 'android' && androidStyles.searchContainer
          ]}>
            <View style={styles.searchIcon}>
              <SearchIcon size={20} color={COLORS.greyMid} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={index === 0 ? "Search by username..." : "Search tokens..."}
              placeholderTextColor={COLORS.greyDark}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardAppearance="dark"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <CloseIcon size={18} color={COLORS.greyMid} />
              </TouchableOpacity>
            )}
          </View>

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    marginHorizontal: width < 375 ? 12 : 12,
    marginVertical: width < 375 ? 4 : 6,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderDarkColor,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.white,
    letterSpacing: TYPOGRAPHY.letterSpacing,
  },
  clearButton: {
    padding: 5,
  },