import React from 'react'

import {
    StyleSheet,
    Text,
    View,
} from 'react-native'

export default class LoadingView extends React.Component {

    render() {
        return (
            <View style={styles.container}>
                <Text>
                    Loading...
                </Text>
            </View>
        )
    }
}

var styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor : '#ffffff',
    },
});
