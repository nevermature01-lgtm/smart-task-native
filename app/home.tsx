import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import MenuScreen from './menu';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const HamburgerMenu = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.hamburgerContainer}>
    <View style={styles.hamburgerBar} />
    <View style={styles.hamburgerBar} />
    <View style={styles.hamburgerBar} />
  </TouchableOpacity>
);

const ActionButton = ({ icon, label, color, bg }) => (
  <View style={styles.actionItem}>
    <View style={[styles.actionButton, styles.customShadow]}>
      <View style={[styles.actionIconContainer, { backgroundColor: bg }]}>
        <Feather name={icon} size={32} color={color} />
      </View>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const HomeScreen = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState('User');
  const slideAnim = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().firstName);
        }
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuVisible ? 0 : -300,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [menuVisible]);

  return (
    <SafeAreaView style={styles.body} edges={['top']}>
      <View style={styles.mainContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <HamburgerMenu onPress={() => setMenuVisible(true)} />
              <Text style={styles.userName}>Hi, {userName} 👋</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.iconButton, styles.customShadow]}>
                <Feather name="search" size={20} color="#4b5563" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, styles.customShadow]}>
                <Feather name="bell" size={20} color="#4b5563" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.mainTitle}>My Evernote</Text>
            <Text style={styles.dateText}>Today January 11, 2027</Text>
          </View>

          <View style={styles.primaryActions}>
            <LinearGradient
              colors={['#b794f4', '#9061f9']}
              style={styles.actionCard}
            >
              <View style={styles.cardIcon}>
                <Feather name="plus" size={24} color="white" />
              </View>
              <View>
                <Text style={styles.cardSubtitle}>Create</Text>
                <Text style={styles.cardTitle}>New Note</Text>
              </View>
              <View style={styles.cardDecorator} />
            </LinearGradient>
            <LinearGradient
              colors={['#fbd38d', '#ed8936']}
              style={styles.actionCard}
            >
              <View style={styles.cardIcon}>
                <Feather name="plus" size={24} color="white" />
              </View>
              <View>
                <Text style={styles.cardSubtitle}>Create</Text>
                <Text style={styles.cardTitle}>New Task</Text>
              </View>
              <View style={styles.cardDecorator} />
            </LinearGradient>
          </View>

          <View style={styles.progressSection}>
            <View style={[styles.progressCard, styles.customShadow]}>
              <View>
                <Text style={styles.progressTitle}>Complete Your</Text>
                <Text style={styles.progressSubtitle}>Profile Setup</Text>
              </View>
              <Text style={styles.progressPercentage}>80% Done</Text>
            </View>
            <View style={styles.progressBarContainer}>
               <LinearGradient
                colors={['#b794f4', '#fbd38d']}
                style={styles.progressBar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
          
          <View style={styles.actionsSlider}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              <ActionButton icon="book-open" label="Notebook" color="#ec4899" bg="#fce7f3" />
              <ActionButton icon="camera" label="Camera" color="#a78bfa" bg="#f5f3ff" />
              <ActionButton icon="mic" label="Audio" color="#60a5fa" bg="#eff6ff" />
              <ActionButton icon="calendar" label="Event" color="#fb923c" bg="#fff7ed" />
            </ScrollView>
          </View>

          <View style={styles.scratchPadSection}>
            <View style={styles.scratchPadHeader}>
              <Feather name="edit-2" size={20} color="#9ca3af" />
              <Text style={styles.scratchPadTitle}>Scratch pad</Text>
            </View>
            <View style={styles.scratchPadContent} />
          </View>

        </ScrollView>
        
        <View style={styles.floatingNav}>
          <TouchableOpacity style={styles.createButton}>
            <LinearGradient
              colors={['#d6bcfa', '#f6ad55']}
              style={styles.createButtonIcon}
            >
              <Feather name="plus" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          <View style={styles.navIcons}>
            <TouchableOpacity><Feather name="file-text" size={24} style={styles.navIcon} /></TouchableOpacity>
            <TouchableOpacity><Feather name="briefcase" size={24} style={styles.navIcon} /></TouchableOpacity>
            <TouchableOpacity><Feather name="check-square" size={24} style={styles.navIcon} /></TouchableOpacity>
            <TouchableOpacity><Feather name="calendar" size={24} style={styles.navIcon} /></TouchableOpacity>
          </View>
        </View>
        
        <Modal
          transparent
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)} activeOpacity={1}>
            <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
              <MenuScreen />
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.bottomIndicator} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f9fafb' },
  mainContainer: {
    maxWidth: 448,
    marginHorizontal: 'auto',
    backgroundColor: 'white',
    minHeight: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hamburgerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  hamburgerBar: {
    width: 20,
    height: 2,
    backgroundColor: '#4b5563',
    borderRadius: 1,
  },
  userName: { fontWeight: 'bold', color: '#374151', fontSize: 18 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  customShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  greetingSection: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  mainTitle: { fontSize: 30, fontWeight: '800', color: '#1e293b' },
  dateText: { color: '#6b7280', fontWeight: '500', marginTop: 4 },
  primaryActions: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 32,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubtitle: { fontSize: 14, fontWeight: '300', opacity: 0.9, color: 'white' },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  cardDecorator: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
  },
  progressSection: { paddingHorizontal: 24, marginTop: 32 },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  progressTitle: { fontWeight: 'bold', color: '#1e293b' },
  progressSubtitle: { color: '#6b7280', fontSize: 12, fontWeight: '400' },
  progressPercentage: { fontSize: 12, fontWeight: 'bold', color: '#4b5563' },
  progressBarContainer: {
    marginTop: -8,
    zIndex: -1,
    paddingHorizontal: 10,
    height: 20,
    justifyContent: 'center',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    width: '80%',
  },
  actionsSlider: { marginTop: 32 },
  sectionTitle: {
    paddingHorizontal: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 18,
    marginBottom: 16,
  },
  actionItem: {
    width: 96,
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 80,
    height: 80,
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
  scratchPadSection: { paddingHorizontal: 24, marginTop: 24, paddingBottom: 80 },
  scratchPadHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  scratchPadTitle: {
    fontWeight: 'bold',
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scratchPadContent: { minHeight: 100, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  floatingNav: {
    position: 'absolute',
    bottom: 24,
    left: '5%',
    right: '5%',
    backgroundColor: '#0a051f',
    borderRadius: 999,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 50,
  },
  createButton: {
    backgroundColor: 'white',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 24,
    paddingLeft: 4,
    paddingVertical: 4,
    height: 48,
  },
  createButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: { fontWeight: 'bold', color: '#0a051f', fontSize: 14 },
  navIcons: { flexDirection: 'row', gap: 16, paddingHorizontal: 16 },
  navIcon: { color: '#9ca3af' },
  bottomIndicator: {
    position: 'absolute',
    bottom: 4,
    left: '50%',
    marginLeft: -64,
    width: 128,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: '#111827',
  },
});

export default HomeScreen;
