import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Pressable, View } from 'react-native';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';

export default function PostCard({ post, onCommentPress }) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  const [authorData, setAuthorData] = useState(null);
  const [likes, setLikes] = useState(post.likes || []);
  const [liked, setLiked] = useState(false);

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
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error updating likes:', error);
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
    <ThemedView style={[styles.container, { borderBottomColor: theme.iconColor }]}>
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
        <ThemedText style={styles.content}>{post.content}</ThemedText>
      )}

      {/* Post Image */}
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} />
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Like */}
        <Pressable onPress={handleLike} style={styles.actionButton}>
          <Ionicons 
            name={liked ? 'heart' : 'heart-outline'} 
            size={24} 
            color={liked ? '#FF3B30' : theme.iconColor} 
          />
          <ThemedText style={styles.actionText}>{likes.length}</ThemedText>
        </Pressable>

        {/* Comment */}
        <Pressable 
          onPress={() => onCommentPress(post)} 
          style={styles.actionButton}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.iconColor} />
          <ThemedText style={styles.actionText}>
            {post.comments?.length || 0}
          </ThemedText>
        </Pressable>

        {/* Share (Coming Soon) */}
        <Pressable 
          onPress={() => alert('Share feature coming soon!')}
          style={styles.actionButton}
        >
          <Ionicons name="share-outline" size={22} color={theme.iconColor} />
          <ThemedText style={styles.actionText}>{post.shares || 0}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
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
});