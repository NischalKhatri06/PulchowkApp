import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, FlatList, Dimensions, Alert, TextInput, Modal, Pressable, ActivityIndicator } from 'react-native';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';
import FollowersModal from '../../components/FollowersModal';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/colors';
import { useFocusEffect } from '@react-navigation/native';

const windowWidth = Dimensions.get('window').width;

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = 'dyz9an12d';
const CLOUDINARY_UPLOAD_PRESET = 'myPresent';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function PersonalProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followingModalVisible, setFollowingModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      if (!user) {
        setUserData(null);
        setUserPosts([]);
        setLoading(false);
      } else {
        loadUserData();
        loadUserPosts();
      }
    }, [user])
  );

  const loadUserData = async () => {
    try {
      if (!auth.currentUser) {
        setUserData(null);
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
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      if (!auth.currentUser) return;

      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef, 
        where('authorId', '==', auth.currentUser.uid),
        limit(50)
      );
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

  // Pick image and upload to Cloudinary
  const pickAndUploadImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to access your photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Upload image to Cloudinary
  const uploadToCloudinary = async (imageUri) => {
    try {
      setUploadingPhoto(true);

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // Upload to Cloudinary
      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.secure_url;

      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        profilePhoto: imageUrl,
      });

      // Update local state
      setUserData(prev => ({
        ...prev,
        profilePhoto: imageUrl,
      }));

      Alert.alert('Success', 'Profile photo updated!');
      setUploadingPhoto(false);
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      Alert.alert('Error', 'Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              setUserData(null);
              setUserPosts([]);
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  if (!user || !userData) {
    return (
      <ThemedView style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={100} color={theme.iconColor} style={{ opacity: 0.3 }} />
        <Spacer height={20} />
        <ThemedText title style={styles.notLoggedInTitle}>Not Logged In</ThemedText>
        <ThemedText style={styles.notLoggedInText}>Please log in to view your profile</ThemedText>
        <Spacer height={30} />
        <ThemedButton
          onPress={() => router.push('/profile/authPage')}
          style={[styles.loginButton, { backgroundColor: '#007AFF' }]}
        >
          <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Go to Login</ThemedText>
        </ThemedButton>
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
          <Pressable onPress={pickAndUploadImage} disabled={uploadingPhoto}>
            {userData.profilePhoto ? (
              <Image source={{ uri: userData.profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: theme.uiBackground }]}>
                <Ionicons name="person" size={40} color={theme.iconColor} />
              </View>
            )}
            
            {/* Upload Overlay */}
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            
            {/* Add Photo Button */}
            <View style={styles.addPhotoButton}>
              <Ionicons name="add-circle" size={32} color="#007AFF" />
            </View>
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <ThemedText title style={styles.statNumber}>{userPosts.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Posts</ThemedText>
          </View>
          <Pressable style={styles.stat} onPress={() => setFollowersModalVisible(true)}>
            <ThemedText title style={styles.statNumber}>{followers}</ThemedText>
            <ThemedText style={styles.statLabel}>Followers</ThemedText>
          </Pressable>
          <Pressable style={styles.stat} onPress={() => setFollowingModalVisible(true)}>
            <ThemedText title style={styles.statNumber}>{following}</ThemedText>
            <ThemedText style={styles.statLabel}>Following</ThemedText>
          </Pressable>
        </View>
      </View>

      <Spacer height={16} />

      <View style={styles.bioContainer}>
        <ThemedText title style={styles.username}>{userData.name || 'Anonymous'}</ThemedText>
        {userData.bio && <ThemedText style={styles.bio}>{userData.bio}</ThemedText>}
      </View>

      <Spacer height={16} />

      <ThemedButton 
        style={[styles.editButton, { backgroundColor: theme.uiBackground }]} 
        onPress={() => setEditModalVisible(true)}
      >
        <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
      </ThemedButton>

      <Spacer height={16} />

      <View style={[styles.divider, { backgroundColor: theme.iconColor, opacity: 0.2 }]} />

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
          initialNumToRender={9}
          maxToRenderPerBatch={9}
        />
      ) : (
        <View style={styles.emptyPosts}>
          <Ionicons name="images-outline" size={64} color={theme.iconColor} style={{ opacity: 0.3 }} />
          <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
        </View>
      )}

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

            <Pressable 
              onPress={pickAndUploadImage} 
              style={styles.changePhotoButton}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="camera" size={20} color="#007AFF" />
                  <ThemedText style={styles.changePhotoText}>Change Profile Photo</ThemedText>
                </>
              )}
            </Pressable>

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

      {/* Followers Modal */}
      <FollowersModal
        visible={followersModalVisible}
        onClose={() => setFollowersModalVisible(false)}
        followIds={userData.followers || []}
        type="followers"
        currentUserId={auth.currentUser?.uid}
      />

      {/* Following Modal */}
      <FollowersModal
        visible={followingModalVisible}
        onClose={() => setFollowingModalVisible(false)}
        followIds={userData.following || []}
        type="following"
        currentUserId={auth.currentUser?.uid}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  
  // MAIN CONTAINERS
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  // NOT LOGGED IN UI
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
  },

  // PROFILE HEADER ROW
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 20,
    position: 'relative',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // LOADING OVERLAY ON PROFILE PIC
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ADD PHOTO BUTTON
  addPhotoButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 16,
  },

  // STATS ROW
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
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

  // BIO SECTION
  bioContainer: {
    paddingHorizontal: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    opacity: 0.8,
  },

  // EDIT PROFILE BUTTON
  editButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editButtonText: {
    fontWeight: '600',
  },

  // DIVIDER
  divider: {
    height: 1,
    marginVertical: 10,
  },

  // POSTS GRID
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

  // EMPTY STATE
  emptyPosts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.5,
  },

  // LOGOUT BUTTON (FAB)
  logoutButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // MODAL OVERLAY + CONTENT
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // CHANGE PHOTO BUTTON
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // TEXT INPUTS
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'right',
    marginTop: 4,
  },

});
