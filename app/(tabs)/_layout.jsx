import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, Pressable, Keyboard, useColorScheme } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebase';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import ThemedLogo from '../../components/ThemedLogo';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import ThemedIcon from '../../components/ThemedIcon';
import { Colors } from '../../constants/colors';

const TabsLayout = () => {
  const router = useRouter();
  
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  // Load search history when search becomes active
  useEffect(() => {
    if (searchActive && auth.currentUser) {
      loadSearchHistory();
    }
  }, [searchActive]);

  // Load user's search history from Firestore
  const loadSearchHistory = async () => {
    try {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const history = userDoc.data().searchHistory || [];
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  // Save search to history (only when user clicks on result)
  const saveToHistory = async (item) => {
    try {
      if (!auth.currentUser) return;

      const historyItem = {
        id: item.id,
        type: item.type,
        name: item.name,
        image: item.profilePhoto || item.image || null,
        timestamp: new Date().toISOString(),
      };

      // Get current history
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      let currentHistory = userDoc.exists() ? (userDoc.data().searchHistory || []) : [];

      // Remove duplicate if exists (by id and type)
      currentHistory = currentHistory.filter(h => !(h.id === item.id && h.type === item.type));

      // Add new item at the beginning
      currentHistory = [historyItem, ...currentHistory];

      // Keep only last 20 searches
      if (currentHistory.length > 20) {
        currentHistory = currentHistory.slice(0, 20);
      }

      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        searchHistory: currentHistory
      });

      // Update local state
      setSearchHistory(currentHistory);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  // Clear search history
  const clearSearchHistory = async () => {
    try {
      if (!auth.currentUser) return;
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        searchHistory: []
      });
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  // Search users AND clubs by name
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text?.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const searchLower = text.toLowerCase();

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const clubsSnapshot = await getDocs(collection(db, 'clubs'));

      const userResults = usersSnapshot.docs
        .map(doc => ({ id: doc.id, type: 'user', ...doc.data() }))
        .filter(user => user.name?.toLowerCase().includes(searchLower));

      const clubResults = clubsSnapshot.docs
        .map(doc => ({ id: doc.id, type: 'club', ...doc.data() }))
        .filter(club => club.name?.toLowerCase().includes(searchLower));

      setSearchResults([...userResults, ...clubResults]);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  // Navigate and save to history
  const handleSelectResult = async (item) => {
    if (!item?.id) return;
    
    // Save to history
    await saveToHistory(item);
    
    // Navigate
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
    
    if (item.type === 'user') {
      router.push(`/profile/${item.id}`);
    } else if (item.type === 'club') {
      router.push(`/clubs/${item.id}`);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <ThemedLogo style={{ width: 50, height: 60, borderRadius: 10 }} />
              <View style={styles.headerButtons}>
                <ThemedButton onPress={() => setSearchActive(!searchActive)} style={styles.iconButton}>
                  <Ionicons name={searchActive ? 'close' : 'search'} size={26} color={theme.iconColor} />
                </ThemedButton>

                <ThemedButton onPress={() => router.push('/profile')} style={styles.iconButton}>
                  <Ionicons name="menu" size={26} color={theme.iconColor} />
                </ThemedButton>
              </View>
            </View>
          ),
          headerStyle: {
            backgroundColor: theme.navBackground,
            height: 120,
            shadowColor: 'transparent',
            elevation: 0,
          },
          tabBarStyle: {
            backgroundColor: theme.navBackground,
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
            paddingBottom: 8,
            display: searchActive ? 'none' : 'flex', // ✅ Hide tabs when searching
          },
          tabBarActiveTintColor: theme.iconColorFocused,
          tabBarInactiveTintColor: theme.iconColor,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? 'home' : 'home-outline'}
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="notes"
          options={{
            title: 'Notes',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? 'book' : 'book-outline'}
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? 'chatbox' : 'chatbox-outline'}
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="marketplace"
          options={{
            title: 'Marketplace',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? 'cart' : 'cart-outline'}
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="personalProfile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? 'person' : 'person-outline'}
                color={focused ? theme.iconColorFocused : theme.iconColor}
              />
            ),
          }}
        />
      </Tabs>

      {/* Search Overlay */}
      {searchActive && (
        <View style={[styles.searchContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.uiBackground }]}>
            <ThemedIcon name="search" size={20} style={styles.searchIcon} />
            <TextInput
              placeholder="Search users or clubs..."
              placeholderTextColor={theme.iconColor}
              value={searchQuery}
              onChangeText={handleSearch}
              style={[styles.searchInput, { color: theme.text }]}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color={theme.iconColor} />
              </Pressable>
            )}
          </View>

          <FlatList
            keyboardShouldPersistTaps="handled"
            data={searchQuery.trim() ? searchResults : searchHistory}
            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
            ListHeaderComponent={() => (
              searchQuery.trim() === '' && searchHistory.length > 0 ? (
                <View style={styles.historyHeader}>
                  <ThemedText style={styles.historyTitle}>Recent</ThemedText>
                  <Pressable onPress={clearSearchHistory}>
                    <ThemedText style={styles.clearButton}>Clear All</ThemedText>
                  </Pressable>
                </View>
              ) : null
            )}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.resultItem,
                  pressed && styles.resultItemPressed
                ]}
                onPress={() => handleSelectResult(item)}
              >
                <View style={styles.resultContent}>
                  <View style={[styles.resultIcon, { backgroundColor: theme.uiBackground }]}>
                    <Ionicons name={item.type === 'user' ? 'person' : 'people'} size={22} color={theme.iconColorFocused} />
                  </View>
                  <View style={styles.resultText}>
                    <ThemedText style={styles.resultName}>{item.name || 'Unnamed'}</ThemedText>
                    <ThemedText style={styles.resultType}>
                      {item.type === 'user' ? 'User' : 'Club'}
                    </ThemedText>
                  </View>
                  {searchQuery.trim() === '' && (
                    <Ionicons name="time-outline" size={18} color={theme.iconColor} style={{ opacity: 0.5 }} />
                  )}
                  {searchQuery.trim() !== '' && (
                    <Ionicons name="chevron-forward" size={20} color={theme.iconColor} />
                  )}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={theme.iconColor} style={{ opacity: 0.3 }} />
                <ThemedText style={styles.emptyText}>
                  {searchQuery.length > 0 ? `No results found for "${searchQuery}"` : 'No recent searches'}
                </ThemedText>
              </View>
            )}
          />
        </View>
      )}
    </>
  );
};

export default TabsLayout;

const styles = StyleSheet.create({
  headerContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    height: '100%',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    bottom: 0, // ✅ Changed from 60 to 0 since tabs are hidden
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    fontSize: 14,
    color: '#007AFF',
  },
  resultItem: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  resultItemPressed: { opacity: 0.6 },
  resultContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  resultText: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  resultType: { fontSize: 13, opacity: 0.6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 15, opacity: 0.5, textAlign: 'center' },
});