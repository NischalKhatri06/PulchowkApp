import React, { useState } from 'react'
import { StyleSheet, Text, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

import { auth, db } from '../../firebase/firebase'
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'
import Spacer from '../../components/Spacer'
import ThemedButton from '../../components/ThemedButton'
import ThemedTextInput from '../../components/ThemedTextInput'

const SignUp = () => {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    try {
      setLoading(true)

      // 1️⃣ Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = userCredential.user

      // 2️⃣ Create Firestore user profile
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: user.email.split('@')[0], // temporary name
        profilePhoto: null,
        following: [],
        createdAt: serverTimestamp(),
      })

      // 3️⃣ Redirect to Home
      router.replace('/profile/authPage')

    } catch (error) {
      Alert.alert('Signup Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView style={styles.container}>

        <ThemedText title style={styles.title}>
          Sign up your new account
        </ThemedText>

        <Spacer height={20} />

        <ThemedTextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
        />

        <Spacer height={20} />

        <ThemedTextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />

        <Spacer />

        <ThemedButton onPress={handleSubmit} disabled={loading}>
          <ThemedText>
            {loading ? 'Creating...' : 'Sign Up'}
          </ThemedText>
        </ThemedButton>

      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default SignUp

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  input: {
    width: '80%',
  },
})
