import React, {useState} from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import {Ionicons} from '@expo/vector-icons'
import {Link, useRouter} from 'expo-router'
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'
import ThemedButton from '../../components/ThemedButton'
import Spacer from '../../components/Spacer'
import {Colors} from '../../constants/colors'
import ThemedIcon from '../../components/ThemedIcon'
import ThemedTextInput from '../../components/ThemedTextInput'

const AuthPage = () => {

  const router = useRouter()
  const [loading, setLoading] = useState(false);


  return (
    <ThemedView style = {styles.container}>

      <View style = {styles.contentbox}>

        <ThemedText title = {true} style = {styles.text}>
            Do you have an account ? If yes Login if not SignUp
        </ThemedText>

        <Spacer/>

        <View style = {styles.buttonRow}>

          {loading ? (

            <ActivityIndicator size = {'small'} style = {{margine : 28}}/>

          ) : (

            <>

              <ThemedButton
                onPress = {() => router.push('/profile/login')}
                backgroundColor = {'red'}
                style = {[
                  {justifyContent : 'center'},
                  {alignItems : 'center'},
                  {borderRadius : 20},
                  {width : 150},
                  {paddingVertical : 12}
                ]}
              >
                <ThemedText style = {[
                  {fontSize : 16},
                  {fontWeight : 'bold'},
                ]}>
                  Login
                </ThemedText>
              </ThemedButton>

              <Spacer height = {20} />

              <ThemedButton
                onPress = {() => router.push('/profile/signup')}
                backgroundColor = {'red'}
                style = {[
                  {justifyContent: 'center'},
                  {alignItems: 'center'},
                  {borderRadius: 20},
                  {width: 150},
                  {paddingVertical : 12}
                ]}

              >
                <ThemedText style = {[
                  {fontSize : 16},
                  {fontWeight : 'bold'},
                ]}>
                Sign Up
                </ThemedText>
              </ThemedButton>
            </>
          )}
        </View>

     </View>

    </ThemedView>
  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent : 'center',
    alignItems : 'center',
  },

  buttonRow : {
    flexDirection : 'column',
    justifyContent : 'center',
    alignItems : 'center',
  },

  text: {
    alignText : 'center',
    fontSize : 25,
    fontWeight : 'bold',
  },

  contentbox: {
    width : '80%',
  },

});

export default AuthPage