// components/PostCard.jsx
import React, { useState } from 'react';
import { StyleSheet, Image, Pressable, View } from 'react-native';
import ThemedView from './ThemedView';
import ThemedText from './ThemedText';
import { auth, db } from '../firebase/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function PostCard({ post }) {
  const [likes, setLikes] = useState(post.likes || []);
  const [liked, setLiked] = useState(likes.includes(auth.currentUser?.uid));

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

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.author}>
        {post.authorType === 'club' ? post.authorId.toUpperCase() : `User ${post.authorId}`}
      </ThemedText>

      <ThemedText style={styles.content}>{post.content}</ThemedText>

      {post.image && <Image source={{ uri: post.image }} style={styles.image} />}

      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.actionButton}>
          <ThemedText>{liked ? '❤️' : '🤍'} {likes.length}</ThemedText>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <ThemedText>💬 {post.commentsCount || 0}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  author: {
    fontWeight: '700',
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    marginRight: 20,
  },
});
