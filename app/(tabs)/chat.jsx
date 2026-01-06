import {StyleSheet} from 'react-native'

import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'

const Chat = () => {

    return (
        <ThemedView style = {styles.container}>
            <ThemedText style = {styles.text} title = {true}>
                Chat
            </ThemedText>
        </ThemedView>
    )
}

const styles = StyleSheet.create({

    container : {
        flex : 1,
        justifyContent : 'center',
        alignItems : 'center',
    },

    text : {
        fontSize : 25,
        textAlign : 'center',
    },

})

export default Chat