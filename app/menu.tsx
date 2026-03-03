
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
  { href: '/home', icon: 'home', text: 'Home', color: '#2563EB' },
  { href: '/switch-account', icon: 'users', text: 'Switch Account', color: '#10B981' },
  { href: '/theme', icon: 'droplet', text: 'Theme', color: '#8B5CF6' },
  { href: '/settings', icon: 'settings', text: 'Settings', color: '#6366F1' },
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
          <Feather name="x" size={20} color="#4B5563" />
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
              style={[styles.menuItem, isActive && styles.activeMenuItem(item.color)]}
              onPress={() => handleNavigation(item.href)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isActive && styles.activeIconContainer(item.color)]}>
                <Feather
                  name={item.icon}
                  size={22}
                  color={isActive ? '#FFFFFF' : '#4B5563'}
                />
              </View>
              <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText(item.color)]}>
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
            <Feather name="log-out" size={22} color="#EF4444" />
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
    backgroundColor: '#F9FAFB',
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
    marginTop: 40,
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
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    marginVertical: 2,
  },
  activeMenuItem: (color) => ({}),
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    backgroundColor: '#F3F4F6'
  },
  activeIconContainer: (color) => ({
    backgroundColor: color,
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5
  }),
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  activeMenuItemText: (color) => ({
    color: color,
    fontWeight: 'bold',
  }),
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default CustomDrawerContent;
