import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

const menuItems = [
  { href: '/home', icon: 'home', text: 'Home', color: '#2563EB' },
  { href: '/switch-account', icon: 'users', text: 'Switch Account', color: '#10B981' },
  { href: '/theme', icon: 'droplet', text: 'Theme', color: '#8B5CF6' },
  { href: '/settings', icon: 'settings', text: 'Settings', color: '#6366F1' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gridPattern: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.05,
  },
  closeButton: {
    position: 'absolute',
    top: 45,
    right: 20,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  menuItemsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  activeMenuItem: (color) => ({
    backgroundColor: color,
    shadowColor: color,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  }),
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(0,0,0,0.03)'
  },
  activeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  activeMenuItemText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

const AnimatedMenuItem = ({ item, index, isActive, handleNavigation }) => {
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(-30);

    useEffect(() => {
        const delay = 150 + index * 70;
        opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
        translateX.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateX: translateX.value }],
        };
    });

    return (
        <Animated.View style={animatedStyle}>
              <TouchableOpacity
                style={[styles.menuItemCard, isActive && styles.activeMenuItem(item.color)]}
                onPress={() => handleNavigation(item.href)}
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                    <Feather name={item.icon} size={22} color={isActive ? '#FFFFFF' : item.color} />
                </View>
                <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>{item.text}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const CustomDrawerContent = ({ closeMenu, user }) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const userName = user ? (user.displayName || user.email.split('@')[0]) : 'Guest';
  const userEmail = user ? user.email : '';
  const initial = userName ? userName[0].toUpperCase() : '?';

  const handleNavigation = (href) => {
    router.push(href);
    if (closeMenu) {
      closeMenu();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (closeMenu) {
        closeMenu();
      }
    } catch (error) {
        console.error("Logout Error: ", error);
    }
  };

  const closeButtonOpacity = useSharedValue(0);
  const closeButtonTranslateX = useSharedValue(20);

  useEffect(() => {
      closeButtonOpacity.value = withDelay(300, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
      closeButtonTranslateX.value = withDelay(300, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const animatedCloseButtonStyle = useAnimatedStyle(() => ({
      opacity: closeButtonOpacity.value,
      transform: [{ translateX: closeButtonTranslateX.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.gridPattern} />
      <Animated.View style={animatedCloseButtonStyle}>
        <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
            <Feather name="x" size={20} color="#4B5563" />
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {user && user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      <View style={styles.menuItemsContainer}>
        {menuItems.map((item, index) => {
            const isActive = pathname === item.href;
            return <AnimatedMenuItem key={item.href} item={item} index={index} isActive={isActive} handleNavigation={handleNavigation} />
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
            <Feather name="log-out" size={22} color="#FFFFFF" style={{marginRight: 12}} />
            <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CustomDrawerContent;
