import React, { useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';
import ThemedTextInput from '../../components/ThemedTextInput';

import { auth, db } from '../../firebase/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


const Login = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    try {
      // 1️⃣ Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2️⃣ Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        Alert.alert('Error', 'User data not found in Firestore.');
        return;
      }

      const userData = userDoc.data();
      console.log('Logged in user:', userData);

      Alert.alert('Success', `Welcome ${userData.name}!`);
      router.push('/(tabs)/home'); // redirect to home
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>
        <Spacer />

        <ThemedText title style={styles.title}>
          Login to your account
        </ThemedText>

        <Spacer height={20} />
        <ThemedTextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Spacer height={10} />
        <ThemedTextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Spacer height={20} />
        <ThemedButton onPress={handleSubmit}>
          <ThemedText>Login</ThemedText>
        </ThemedButton>

        <Spacer height={40} />
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { textAlign: 'center', fontSize: 18, marginBottom: 30 },
  input: { width: '80%', marginBottom: 12 },
});
