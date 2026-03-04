import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import CustomDrawerContent from './menu';
import { auth } from '../firebase';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const MenuButton = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = auth.currentUser;
  const translateX = useSharedValue(-width);

  const toggleMenu = () => {
    if (isMenuOpen) {
      translateX.value = withTiming(-width, { duration: 300, easing: Easing.inOut(Easing.ease) });
      setTimeout(() => setIsMenuOpen(false), 300);
    } else {
      setIsMenuOpen(true);
      translateX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
            <Feather name="menu" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Modal
            transparent={true}
            visible={isMenuOpen}
            onRequestClose={toggleMenu}
        >
            <View style={styles.modalOverlay} onStartShouldSetResponder={toggleMenu}>
                <Animated.View style={[styles.drawerContainer, animatedStyle]}>
                    <CustomDrawerContent closeMenu={toggleMenu} user={user} />
                </Animated.View>
            </View>
        </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    flex: 1,
    width: '80%',
    backgroundColor: '#F9FAFB',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});

export default MenuButton;
