import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';

const windowWidth = Dimensions.get('window').width;

export default function PersonalProfile() {
  // Placeholder data for now
  const profilePhoto = 'https://via.placeholder.com/100';
  const username = 'nischal_kc';
  const bio = 'This is my bio. Welcome to my profile!';
  const posts = Array.from({ length: 12 }).map((_, i) => `https://via.placeholder.com/150?text=Post+${i+1}`);
  const followers = 120;
  const following = 180;

  return (
    <ThemedView style={styles.container}>
      {/* Profile Info Row */}
      <View style={styles.topRow}>
        <Image source={{ uri: profilePhoto }} style={styles.profileImage} />

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <ThemedText title>{posts.length}</ThemedText>
            <ThemedText>Posts</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText title>{followers}</ThemedText>
            <ThemedText>Followers</ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText title>{following}</ThemedText>
            <ThemedText>Following</ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={10} />

      {/* Username & Bio */}
      <View style={styles.bioContainer}>
        <ThemedText title>{username}</ThemedText>
        <ThemedText>{bio}</ThemedText>
      </View>

      <Spacer height={10} />

      {/* Edit Profile Button */}
      <ThemedButton style={styles.editButton} onPress={() => alert('Edit Profile clicked')}>
        <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Edit Profile</ThemedText>
      </ThemedButton>

      <Spacer height={10} />

      {/* Divider Line */}
      <View style={styles.divider} />

      {/* Posts Section */}
      <FlatList
        data={posts}
        keyExtractor={(_, index) => index.toString()}
        numColumns={3}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.postImage} />
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  statsContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-around', marginLeft: 16 },
  stat: { alignItems: 'center' },
  bioContainer: { marginTop: 8 },
  editButton: { backgroundColor: '#0E0F14', borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 10 },
  postImage: { width: (windowWidth - 48) / 3, height: (windowWidth - 48) / 3, margin: 2 },
});
