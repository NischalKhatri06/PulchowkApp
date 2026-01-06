import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, ScrollView, View, FlatList, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../../firebase/firebase';
import ThemedView from '../../../components/ThemedView';
import ThemedText from '../../../components/ThemedText';
import ThemedButton from '../../../components/ThemedButton';
import Spacer from '../../../components/Spacer';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../../constants/colors';

const windowWidth = Dimensions.get('window').width;

export default function ClubProfile() {
  const { clubId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [clubData, setClubData] = useState(null);
  const [clubPosts, setClubPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClubData();
    loadClubPosts();
  }, [clubId]);

  // Load club data
  const loadClubData = async () => {
    try {
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      if (clubDoc.exists()) {
        const data = clubDoc.data();
        setClubData(data);

        // Check if current user is following this club
        if (auth.currentUser) {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const following = userDoc.data().following || [];
            setIsFollowing(following.includes(clubId));
          }
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading club:', error);
      setLoading(false);
    }
  };

  // Load club posts
  const loadClubPosts = async () => {
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('authorId', '==', clubId), where('authorType', '==', 'club'));
      const snapshot = await getDocs(q);

      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClubPosts(posts);
    } catch (error) {
      console.error('Error loading club posts:', error);
    }
  };

  // Follow/Unfollow club
  const handleFollowToggle = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Login Required', 'Please log in to follow clubs');
        return;
      }

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const clubRef = doc(db, 'clubs', clubId);

      if (isFollowing) {
        // Unfollow
        await updateDoc(userRef, {
          following: arrayRemove(clubId)
        });
        await updateDoc(clubRef, {
          followers: arrayRemove(auth.currentUser.uid)
        });
        setIsFollowing(false);
        
        // Update local state immediately
        setClubData(prev => ({
          ...prev,
          followers: prev.followers?.filter(id => id !== auth.currentUser.uid) || []
        }));
      } else {
        // Follow
        await updateDoc(userRef, {
          following: arrayUnion(clubId)
        });
        await updateDoc(clubRef, {
          followers: arrayUnion(auth.currentUser.uid)
        });
        setIsFollowing(true);
        
        // Update local state immediately
        setClubData(prev => ({
          ...prev,
          followers: [...(prev.followers || []), auth.currentUser.uid]
        }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Loading club...</ThemedText>
      </ThemedView>
    );
  }

  if (!clubData) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Club not found</ThemedText>
      </ThemedView>
    );
  }

  const followerCount = clubData.followers?.length || 0;

  return (
    <ScrollView>
      {/* Cover Image */}
      <Image source={{ uri: clubData.image }} style={styles.cover} />

      <ThemedView style={styles.content}>
        {/* Club Info */}
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <ThemedText style={styles.name}>{clubData.name}</ThemedText>
            <ThemedText style={styles.bio}>{clubData.bio}</ThemedText>
          </View>
        </View>

        <Spacer height={12} />

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <ThemedText title style={styles.statNumber}>{clubPosts.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Posts</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText title style={styles.statNumber}>{followerCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Followers</ThemedText>
          </View>
        </View>

        <Spacer height={16} />

        {/* Follow Button */}
        <ThemedButton
          onPress={handleFollowToggle}
          style={[
            styles.followButton,
            { backgroundColor: isFollowing ? theme.uiBackground : '#007AFF' }
          ]}
        >
          <ThemedText style={[
            styles.followButtonText,
            { color: isFollowing ? theme.text : '#fff' }
          ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </ThemedText>
        </ThemedButton>

        <Spacer height={24} />

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.iconColor, opacity: 0.2 }]} />

        {/* Posts Section */}
        <ThemedText style={styles.sectionTitle}>Posts</ThemedText>

        {clubPosts.length > 0 ? (
          <FlatList
            data={clubPosts}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.postImageContainer}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.postImage} />
                ) : (
                  <View style={[styles.postImage, { backgroundColor: theme.uiBackground }]}>
                    <ThemedText style={styles.postContent} numberOfLines={3}>
                      {item.content}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyPosts}>
            <Ionicons name="images-outline" size={64} color={theme.iconColor} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  cover: {
    width: '100%',
    height: 240,
  },

  content: {
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  nameContainer: {
    flex: 1,
  },

  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },

  bio: {
    fontSize: 14,
    opacity: 0.7,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 32,
  },

  stat: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },

  statLabel: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },

  followButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },

  followButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },

  divider: {
    height: 1,
    marginVertical: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },

  postImageContainer: {
    margin: 1,
  },

  postImage: {
    width: (windowWidth - 36) / 3,
    height: (windowWidth - 36) / 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  postContent: {
    fontSize: 10,
    padding: 4,
    textAlign: 'center',
  },

  emptyPosts: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyText: {
    marginTop: 12,
    opacity: 0.6,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
});