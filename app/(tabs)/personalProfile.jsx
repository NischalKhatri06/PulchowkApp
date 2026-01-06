import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, FlatList, Dimensions, Alert, TextInput, Modal, Pressable } from 'react-native';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/colors';

const windowWidth = Dimensions.get('window').width;

export default function PersonalProfile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    loadUserData();
    loadUserPosts();
  }, []);

  // Load user data from Firestore
  const loadUserData = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'Please log in first');
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setEditName(data.name || '');
        setEditBio(data.bio || '');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile');
      setLoading(false);
    }
  };

  // Load user's posts
  const loadUserPosts = async () => {
    try {
      if (!auth.currentUser) return;

      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('authorId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);

      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUserPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  // Update profile
  const handleSaveProfile = async () => {
    try {
      if (!auth.currentUser) return;

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        name: editName.trim() || userData.name,
        bio: editBio.trim(),
      });

      setUserData(prev => ({
        ...prev,
        name: editName.trim() || prev.name,
        bio: editBio.trim(),
      }));

      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Success', 'Logged out successfully');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  if (!userData) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please log in to view your profile</ThemedText>
      </ThemedView>
    );
  }

  const followers = userData.followers?.length || 0;
  const following = userData.following?.length || 0;

  return (
    <ThemedView style={styles.container}>
      {/* Profile Info Row */}
      <View style={styles.topRow}>
        <View style={styles.profileImageContainer}>
          {userData.profilePhoto ? (
            <Image source={{ uri: userData.profilePhoto }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: theme.uiBackground }]}>
              <Ionicons name="person" size={40} color={theme.iconColor} />
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <ThemedText title style={styles.statNumber}>{userPosts.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Posts</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText title style={styles.statNumber}>{followers}</ThemedText>
            <ThemedText style={styles.statLabel}>Followers</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText title style={styles.statNumber}>{following}</ThemedText>
            <ThemedText style={styles.statLabel}>Following</ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={16} />

      {/* Username & Bio */}
      <View style={styles.bioContainer}>
        <ThemedText title style={styles.username}>{userData.name || 'Anonymous'}</ThemedText>
        {userData.bio && <ThemedText style={styles.bio}>{userData.bio}</ThemedText>}
      </View>

      <Spacer height={16} />

      {/* Edit Profile Button */}
      <ThemedButton 
        style={[styles.editButton, { backgroundColor: theme.uiBackground }]} 
        onPress={() => setEditModalVisible(true)}
      >
        <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
      </ThemedButton>

      <Spacer height={16} />

      {/* Divider Line */}
      <View style={[styles.divider, { backgroundColor: theme.iconColor, opacity: 0.2 }]} />

      {/* Posts Section */}
      {userPosts.length > 0 ? (
        <FlatList
          data={userPosts}
          keyExtractor={(item) => item.id}
          numColumns={3}
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
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : (
        <View style={styles.emptyPosts}>
          <Ionicons name="images-outline" size={64} color={theme.iconColor} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
        </View>
      )}

      {/* Logout Button - Bottom Right */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={28} color="#ff4444" />
      </Pressable>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.iconColor} />
              </Pressable>
              <ThemedText title style={styles.modalTitle}>Edit Profile</ThemedText>
              <Pressable onPress={handleSaveProfile}>
                <ThemedText style={styles.saveButton}>Save</ThemedText>
              </Pressable>
            </View>

            <Spacer height={20} />

            <ThemedText style={styles.label}>Name</ThemedText>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.input, { backgroundColor: theme.uiBackground, color: theme.text }]}
              placeholder="Enter your name"
              placeholderTextColor={theme.iconColor}
            />

            <Spacer height={16} />

            <ThemedText style={styles.label}>Bio</ThemedText>
            <TextInput
              value={editBio}
              onChangeText={setEditBio}
              style={[styles.input, styles.bioInput, { backgroundColor: theme.uiBackground, color: theme.text }]}
              placeholder="Write something about yourself..."
              placeholderTextColor={theme.iconColor}
              multiline
              maxLength={150}
            />
            <ThemedText style={styles.charCount}>{editBio.length}/150</ThemedText>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 16 
  },

  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },

  profileImageContainer: { 
    marginRight: 20 
  },

  profileImage: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  statsContainer: { 
    flexDirection: 'row', 
    flex: 1, 
    justifyContent: 'space-around' 
  },

  stat: { 
    alignItems: 'center' 
  },

  statNumber: { 
    fontSize: 18, 
    fontWeight: '700' 
  },

  statLabel: { 
    fontSize: 13, 
    opacity: 0.6, 
    marginTop: 2 
  },

  bioContainer: { 
    paddingHorizontal: 4 
  },

  username: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4 
  },

  bio: { 
    fontSize: 14, 
    opacity: 0.8 
  },

  editButton: { 
    borderRadius: 8, 
    paddingVertical: 10, 
    alignItems: 'center' 
  },

  editButtonText: { 
    fontWeight: '600' 
  },

  divider: { 
    height: 1, 
    marginVertical: 10 
  },

  postImageContainer: { 
    margin: 1 
  },

  postImage: { 
    width: (windowWidth - 36) / 3, 
    height: (windowWidth - 36) / 3, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  postContent: { 
    fontSize: 10, 
    padding: 4, 
    textAlign: 'center' 
  },

  emptyPosts: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 60 
  },

  emptyText: { 
    marginTop: 16, 
    fontSize: 16, 
    opacity: 0.5 
  },

  logoutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#000',
    
    shadowOffset: { 
      width: 0, 
      height: 2 
    },

    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },

  modalContent: { 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    minHeight: 400 
  },

  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },

  modalTitle: { 
    fontSize: 18, 
    fontWeight: '700' 
  },

  saveButton: { 
    color: '#007AFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },

  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },

  input: { 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 16 
  },

  bioInput: { 
    height: 100, 
    textAlignVertical: 'top' 
  },

  charCount: { 
    fontSize: 12, 
    opacity: 0.5, 
    textAlign: 'right', 
    marginTop: 4 
  },

});
