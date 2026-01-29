import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Pressable, View, Modal, FlatList, Alert } from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';
import ThemedButton from './ThemedButton';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';

export default function PostCard({ post, onCommentPress, onPostPress }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [authorData, setAuthorData] = useState(null);
  const [likes, setLikes] = useState(post.likes || []);
  const [liked, setLiked] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadAuthorData();
    setLiked(likes.includes(auth.currentUser?.uid));
  }, []);

  const loadAuthorData = async () => {
    try {
      if (post.authorType === 'user') {
        const userDoc = await getDoc(doc(db, 'users', post.authorId));
        if (userDoc.exists()) {
          setAuthorData(userDoc.data());
        }
      } else if (post.authorType === 'club') {
        const clubDoc = await getDoc(doc(db, 'clubs', post.authorId));
        if (clubDoc.exists()) {
          setAuthorData(clubDoc.data());
        }
      }
    } catch (error) {
      console.error('Error loading author:', error);
    }
  };

  const loadShareOptions = async () => {
    try {
      if (!auth.currentUser) return;

      // Load users for DMs
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('email', '!=', auth.currentUser.email));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'user',
        ...doc.data(),
      }));

      // Load groups
      const groupsRef = collection(db, 'groups');
      const groupsQuery = query(groupsRef, where('members', 'array-contains', auth.currentUser.uid));
      const groupsSnapshot = await getDocs(groupsQuery);
      const groupsList = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'group',
        ...doc.data(),
      }));

      setUsers(usersList);
      setGroups(groupsList);
    } catch (error) {
      console.error('Error loading share options:', error);
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser) return;

    const postRef = doc(db, 'posts', post.id);

    try {
      if (liked) {
        await updateDoc(postRef, { likes: arrayRemove(auth.currentUser.uid) });
        setLikes(prev => prev.filter(uid => uid !== auth.currentUser.uid));
      } else {
        await updateDoc(postRef, { likes: arrayUnion(auth.currentUser.uid) });
        setLikes(prev => [...prev, auth.currentUser.uid]);
        
        // Create notification for post author
        if (post.authorId !== auth.currentUser.uid) {
          await createNotification(post.authorId, 'like', post.id);
        }
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleShare = async () => {
    if (!auth.currentUser) {
      Alert.alert('Login Required', 'Please log in to share posts');
      return;
    }

    await loadShareOptions();
    setShareModalVisible(true);
  };

  const shareToChat = async (target) => {
    setSharing(true);
    try {
      const sharedPostData = {
        content: post.content,
        image: post.image,
        authorName: authorData?.name || 'Unknown',
        authorId: post.authorId,
      };

      if (target.type === 'user') {
        // Share to DM
        const chatId = [auth.currentUser.uid, target.id].sort().join('_');
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        
        await addDoc(messagesRef, {
          sendBy: auth.currentUser.uid,
          sendTo: target.id,
          type: 'shared_post',
          sharedPost: sharedPostData,
          createdAt: serverTimestamp(),
        });

        // Create notification
        await createNotification(target.id, 'share', post.id);
      } else {
        // Share to Group
        const messagesRef = collection(db, 'groups', target.id, 'messages');
        
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const senderName = userDoc.exists() ? userDoc.data().name : 'User';

        await addDoc(messagesRef, {
          sendBy: auth.currentUser.uid,
          senderName: senderName,
          type: 'shared_post',
          sharedPost: sharedPostData,
          createdAt: serverTimestamp(),
        });
      }

      // Update share count
      const postRef = doc(db, 'posts', post.id);
      await updateDoc(postRef, {
        shares: (post.shares || 0) + 1
      });

      Alert.alert('Success', 'Post shared successfully!');
      setShareModalVisible(false);
    } catch (error) {
      console.error('Error sharing post:', error);
      Alert.alert('Error', 'Failed to share post');
    } finally {
      setSharing(false);
    }
  };

  const createNotification = async (userId, type, postId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userName = userDoc.exists() ? userDoc.data().name : 'Someone';

      await addDoc(collection(db, 'notifications'), {
        userId: userId,
        type: type,
        fromUserId: auth.currentUser.uid,
        fromUserName: userName,
        postId: postId,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleAuthorPress = () => {
    if (post.authorType === 'user') {
      router.push(`/profile/${post.authorId}`);
    } else if (post.authorType === 'club') {
      router.push(`/clubs/${post.authorId}`);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const postDate = timestamp.toDate();
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  return (
    <Pressable 
      style={[styles.container, { borderBottomColor: theme.iconColor }]}
      onPress={() => onPostPress && onPostPress(post)}
    >
      {/* Author Header */}
      <Pressable style={styles.header} onPress={handleAuthorPress}>
        <View style={[styles.avatar, { backgroundColor: theme.uiBackground }]}>
          {authorData?.profilePhoto || authorData?.image ? (
            <Image 
              source={{ uri: authorData.profilePhoto || authorData.image }} 
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons 
              name={post.authorType === 'user' ? 'person' : 'people'} 
              size={20} 
              color={theme.iconColor} 
            />
          )}
        </View>

        <View style={styles.authorInfo}>
          <ThemedText style={styles.authorName}>
            {authorData?.name || 'Loading...'}
          </ThemedText>
          <ThemedText style={styles.timestamp}>
            {formatTimestamp(post.createdAt)}
          </ThemedText>
        </View>
      </Pressable>

      {/* Post Content */}
      {post.content && (
        <ThemedText style={styles.content} numberOfLines={6}>{post.content}</ThemedText>
      )}

      {/* Post Image or Video */}
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} />
      )}
      
      {post.video && (
        <View style={styles.videoContainer}>
          <Image source={{ uri: post.videoThumbnail || post.video }} style={styles.postImage} />
          <View style={styles.playButton}>
            <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Like */}
        <Pressable onPress={(e) => {
          e.stopPropagation();
          handleLike();
        }} style={styles.actionButton}>
          <Ionicons 
            name={liked ? 'heart' : 'heart-outline'} 
            size={24} 
            color={liked ? '#FF3B30' : theme.iconColor} 
          />
          <ThemedText style={styles.actionText}>{likes.length}</ThemedText>
        </Pressable>

        {/* Comment */}
        <Pressable 
          onPress={(e) => {
            e.stopPropagation();
            onCommentPress(post);
          }}
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.iconColor} />
          <ThemedText style={styles.actionText}>
            {post.comments?.length || 0}
          </ThemedText>
        </Pressable>

        {/* Share */}
        <Pressable 
          onPress={(e) => {
            e.stopPropagation();
            handleShare();
          }}
          style={styles.actionButton}
        >
          <Ionicons name="share-outline" size={22} color={theme.iconColor} />
          <ThemedText style={styles.actionText}>{post.shares || 0}</ThemedText>
        </Pressable>
      </View>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShareModalVisible(false)}>
          <Pressable style={[styles.shareModal, { backgroundColor: theme.background }]}>
            <ThemedText title style={styles.modalTitle}>Share Post</ThemedText>

            <FlatList
              data={[...users, ...groups]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ThemedButton
                  style={[styles.shareOption, { backgroundColor: theme.uiBackground }]}
                  onPress={() => shareToChat(item)}
                  disabled={sharing}
                >
                  <View style={[styles.shareAvatar, { backgroundColor: theme.background }]}>
                    {item.profilePhoto || item.image ? (
                      <Image source={{ uri: item.profilePhoto || item.image }} style={styles.shareAvatarImage} />
                    ) : (
                      <Ionicons name={item.type === 'user' ? 'person' : 'people'} size={20} color={theme.iconColor} />
                    )}
                  </View>
                  <View style={styles.shareInfo}>
                    <ThemedText style={styles.shareName}>{item.name}</ThemedText>
                    <ThemedText style={styles.shareType}>
                      {item.type === 'user' ? 'Direct Message' : 'Group'}
                    </ThemedText>
                  </View>
                  <Ionicons name="send-outline" size={20} color={theme.iconColor} />
                </ThemedButton>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyShare}>
                  <ThemedText style={styles.emptyText}>No chats available</ThemedText>
                </View>
              )}
            />

            <ThemedButton
              style={[styles.closeButton, { backgroundColor: theme.uiBackground }]}
              onPress={() => setShareModalVisible(false)}
            >
              <ThemedText>Cancel</ThemedText>
            </ThemedButton>
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
  },
  content: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
  },
  actions: {
    flexDirection: 'row',
    paddingTop: 8,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  shareAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  shareAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shareInfo: {
    flex: 1,
  },
  shareName: {
    fontSize: 15,
    fontWeight: '600',
  },
  shareType: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyShare: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
  closeButton: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
});