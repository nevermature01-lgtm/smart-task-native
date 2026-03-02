import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

const MenuItem = ({ icon, text, isBottom, ...props }) => {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, isBottom && styles.bottomMenuItem]}
      {...props}
    >
      <Feather name={icon} size={24} color="#4b5563" />
      <Text style={styles.menuItemText}>{text}</Text>
    </TouchableOpacity>
  );
}

const Avatar = ({ userName }) => {
  const initial = userName ? userName[0].toUpperCase() : '?';
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
};

const MenuScreen = ({ userName, userEmail, closeMenu }) => {
  
  return (
    <View style={styles.menuContent}>
      <TouchableOpacity style={styles.closeButton} onPress={closeMenu}>
        <Feather name="x" size={24} color="#1f2937" />
      </TouchableOpacity>

      <View style={styles.profileSection}>
        <Avatar userName={userName} />
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
      </View>

      <View style={styles.menuItemsContainer}>
        <MenuItem icon="home" text="Home" onPress={closeMenu} />
        <Link href="/switch-account" asChild>
          <MenuItem icon="users" text="Switch account" onPress={closeMenu}/>
        </Link>
        <MenuItem icon="star" text="Get more storage" onPress={closeMenu}/>
        <MenuItem icon="settings" text="Settings" onPress={closeMenu}/>
      </View>
      
      <View style={styles.bottomMenuItemsContainer}>
        <MenuItem icon="log-out" text="Logout" isBottom />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuContent: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 80, 
    paddingHorizontal: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4f46e5',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
  },
  avatarText: {
    color: '#1f2937',
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    color: '#1f2937',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  bottomMenuItemsContainer: {
    paddingBottom: 20,
  },
  bottomMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  menuItemText: {
    color: '#1f2937',
    fontSize: 18,
    marginLeft: 20,
  },
});

export default MenuScreen;
