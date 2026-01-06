import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import PostCard from '../../components/PostCard';
import { getFeedPosts } from '../../utils/posts';
import { auth } from '../../firebase/firebase';

const clubs = [
  { id: 'robotics', name: 'Robotics', image: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b' },
  { id: 'music', name: 'Music', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d' },
  { id: 'sports', name: 'Sports', image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d' },
  { id: 'ai', name: 'AI Society', image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995' },
  { id: 'photography', name: 'Photography', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee' },
  { id: 'drama', name: 'Drama', image: 'https://images.unsplash.com/photo-1515165562835-c3b8c97dcbdb' },
  { id: 'literature', name: 'Literature', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794' },
  { id: 'entrepreneurship', name: 'Startup', image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd' },
  { id: 'environment', name: 'Environment', image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6' },
  { id: 'it', name: 'IT Club', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475' },
];

export default function Home() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchFeed() {
      if (!auth.currentUser) return;
      const feedPosts = await getFeedPosts(auth.currentUser.uid, 30);
      setPosts(feedPosts);
    }
    fetchFeed();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={posts}
        ListHeaderComponent={() => (
          <>
            {/* Hero box */}
            <Pressable style={styles.heroBox} onPress={() => router.push('/')} />
            <Spacer height={20} />

            {/* Clubs horizontal scroll */}
            <FlatList
              horizontal
              data={clubs}
              keyExtractor={item => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clubsRow}
              renderItem={({ item }) => (
                <Pressable style={styles.clubItem} onPress={() => router.push(`/clubs/${item.id}`)}>
                  <ThemedView style={styles.ring}>
                    <Image source={{ uri: item.image }} style={styles.image} />
                  </ThemedView>
                  <ThemedText style={styles.clubName} numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                </Pressable>
              )}
            />
            <Spacer height={32} />
          </>
        )}
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </ThemedView>
  );
}

const SIZE = 70;
const RING = 78;

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBox: { height: 280, margin: 16, borderRadius: 22, backgroundColor: '#6a00ff' },
  clubsRow: { paddingHorizontal: 16 },
  clubItem: { width: 82, alignItems: 'center', marginRight: 14 },
  ring: { width: RING, height: RING, borderRadius: RING / 2, justifyContent: 'center', alignItems: 'center' },
  image: { width: SIZE, height: SIZE, borderRadius: SIZE / 2 },
  clubName: { marginTop: 6, fontSize: 12, textAlign: 'center' },
});
