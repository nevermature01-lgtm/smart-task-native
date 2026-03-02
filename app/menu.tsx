
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

const user = {
  name: 'Adnan',
  email: 'adnankhan75e@gmail.com',
  avatar: null,
};

const menuItems = [
  { href: '/home', icon: 'home', text: 'Home' },
  { href: '/switch-account', icon: 'users', text: 'Switch Account' },
  { href: '/storage', icon: 'database', text: 'Get More Storage' },
  { href: '/settings', icon: 'settings', text: 'Settings' },
];

const CustomDrawerContent = ({ closeMenu }) => {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href) => {
    router.push(href);
    if (closeMenu) {
      closeMenu();
    }
  };

  const handleLogout = () => {
    // Perform logout logic here
    console.log('Logging out...');
    router.push('/login'); 
    if (closeMenu) {
      closeMenu();
    }
  };

  const initial = user.name ? user.name[0].toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
          <Feather name="x" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.menuItemsContainer}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <TouchableOpacity
              key={item.href}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => handleNavigation(item.href)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Feather
                  name={item.icon}
                  size={22}
                  color={isActive ? '#2563EB' : '#333'}
                />
              </View>
              <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Feather name="log-out" size={22} color="#e53935" />
          </View>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 20
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  userName: {
    fontSize: 18,
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
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 20,
    marginVertical: 4, // Approx 20px total vertical space
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderLeftColor: '#2563EB',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 20,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  activeMenuItemText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e53935',
  },
});

export default CustomDrawerContent;
