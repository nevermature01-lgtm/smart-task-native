import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MenuScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Menu Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default MenuScreen;
