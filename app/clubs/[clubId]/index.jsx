import React from 'react'
import { StyleSheet, Image, ScrollView } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import ThemedView from '../../../components/ThemedView'
import ThemedText from '../../../components/ThemedText'
import ThemedButton from '../../../components/ThemedButton'
import Spacer from '../../../components/Spacer'

const clubs = {
  robotics: {
    name: 'Robotics Club',
    image: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b',
    bio: 'We build and program robots for competitions, research, and innovation.',
  },
  music: {
    name: 'Music Club',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
    bio: 'A creative space for musicians, jam sessions, and performances.',
  },
  sports: {
    name: 'Sports Club',
    image: 'https://images.unsplash.com/photo-1521412644187-c49fa049e84d',
    bio: 'Promoting fitness, teamwork, and competitive sports.',
  },
  ai: {
    name: 'AI Society',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    bio: 'Exploring artificial intelligence, ML, and data science.',
  },
  photography: {
    name: 'Photography Club',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    bio: 'Capturing moments and telling stories through photography.',
  },
  drama: {
    name: 'Drama Club',
    image: 'https://images.unsplash.com/photo-1515165562835-c3b8c97dcbdb',
    bio: 'Creating and performing theatrical plays, skits, and stage productions.',
  },
  literature: {
    name: 'Literature Club',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794',
    bio: 'Exploring novels, poetry, and creative writing while fostering discussion.',
  },
  entrepreneurship: {
    name: 'Startup Club',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd',
    bio: 'Encouraging innovation, business ideas, and startup projects.',
  },
  environment: {
    name: 'Environment Club',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6',
    bio: 'Promoting sustainability, green initiatives, and environmental awareness.',
  },
  it: {
    name: 'IT Club',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
    bio: 'Focusing on programming, software development, and tech projects.',
  },

}

export default function ClubProfile() {
  const { clubId } = useLocalSearchParams()
  const club = clubs[clubId]

  if (!club) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Club not found</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ScrollView>
      <Image source={{ uri: club.image }} style={styles.cover} />

      <ThemedView style={styles.content}>
        <ThemedText style={styles.name}>{club.name}</ThemedText>
        <ThemedText style={styles.bio}>{club.bio}</ThemedText>

        <Spacer height={12} />

        <ThemedButton>
          <ThemedText>
            Follow
          </ThemedText>
        </ThemedButton>

        <Spacer height={24} />

        <ThemedText style={styles.sectionTitle}>Posts</ThemedText>

        <ThemedView style={styles.emptyPosts}>
          <ThemedText>No posts yet</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 240,
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  bio: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyPosts: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})