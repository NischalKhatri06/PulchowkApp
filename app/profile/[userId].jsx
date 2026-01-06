import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';

export default function UserProfile({ params = {} }) {
  // ✅ Default to {} so destructuring never fails
  const { userId } = params;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // track loading state

  useEffect(() => {
    if (!userId) {
      Alert.alert('Error', 'No user ID provided');
      setLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUser(docSnap.data());
        } else {
          Alert.alert('User not found');
          setUser(null);
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error fetching user', error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading user data...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>User not found or an error occurred.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText title>User Profile</ThemedText>
      <Spacer height={20} />
      <ThemedText>Email: {user.email || 'No email'}</ThemedText>
      <Spacer height={10} />
      <ThemedText>Name: {user.name || 'No name set'}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
