import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import MenuScreen from './menu';
import { StatusBar } from 'expo-status-bar';

const CustomToast = ({ message, visible, type }) => {
    if (!visible) return null;
    return (
        <Animated.View style={[styles.toast, type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
};

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
        <Feather name={icon} size={24} color={color} />
      </View>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const TaskCard = ({ task, onPress }) => {
    const { name, dueDate, createdAt, stage } = task;

    const formatDate = (dueTimestamp, createdTimestamp) => {
        const timestamp = dueTimestamp || createdTimestamp;
        if (!timestamp || !timestamp.toDate) return 'No date specified';
        
        const date = timestamp.toDate();

        const dateString = date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        return `${dateString} at ${timeString}`;
    };

    return (
        <TouchableOpacity style={styles.taskCard} onPress={onPress}>
            <View style={styles.taskInfoContainer}>
                <Text style={styles.taskName} numberOfLines={1}>{name}</Text>
                <Text style={styles.taskDueDate}>{formatDate(dueDate, createdAt)}</Text>
            </View>
            <View style={styles.stageBadge}>
                <Text style={styles.stageText}>{stage || 'Stage 1'}</Text>
            </View>
        </TouchableOpacity>
    );
};

const HomeScreen = () => {
  const router = useRouter();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('Guest');
  const [activeAccount, setActiveAccount] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [toastConfig, setToastConfig] = useState({ visible: false, message: '', type: 'success' });
  const toastTimeout = useRef(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    let unsubscribeTasks = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }

      if (currentUser) {
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        let name = '';
        if (userDoc.exists()) {
          name = userDoc.data().firstName;
        } else {
          name = currentUser.displayName || currentUser.email.split('@')[0];
        }
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        setUserName(capitalizedName);

        const storedActiveAccount = await AsyncStorage.getItem('activeAccount');
        const account = storedActiveAccount ? JSON.parse(storedActiveAccount) : { type: 'personal' };
        setActiveAccount(account);

        const tasksCollectionRef = collection(db, 'tasks');
        let tasksQuery;

        if (account.type === 'team') {
          const teamDocRef = doc(db, 'teams', account.id);
          const teamDoc = await getDoc(teamDocRef);
          if (teamDoc.exists()) {
            setTeamDetails(teamDoc.data());
          }
          tasksQuery = query(tasksCollectionRef, where('teamId', '==', account.id));
        } else {
          setTeamDetails(null);
          tasksQuery = query(tasksCollectionRef, where('assignedToId', '==', currentUser.uid), where('teamId', '==', null));
        }

        if (tasksQuery) {
            unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
              const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setTasks(tasksData);
            });
        }

      } else {
        setUser(null);
        setUserName('Guest');
        setActiveAccount(null);
        setTeamDetails(null);
        setTasks([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTasks) {
        unsubscribeTasks();
      }
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const showToast = (message, type = 'success') => {
    if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
    }
    setToastConfig({ visible: true, message, type });
    toastTimeout.current = setTimeout(() => {
        setToastConfig({ visible: false, message: '', type: '' });
    }, 3000);
  };

  const toggleMenu = () => {
    setMenuVisible(!isMenuVisible);
  };

  const handleCopyCode = async (code) => {
    await Clipboard.setStringAsync(code);
    showToast('Team code copied to clipboard!', 'success');
  };

  const handleTaskPress = (taskId) => {
    router.push(`/details?taskId=${taskId}`);
  };

  return (
    <SafeAreaView style={styles.body}>
      <StatusBar style={isMenuVisible ? "light" : "dark"} backgroundColor="transparent" translucent={true} />
      <CustomToast visible={toastConfig.visible} message={toastConfig.message} type={toastConfig.type} />
      <View style={styles.mainContainer}>
        <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            ListHeaderComponent={
                <>
                    <View style={styles.header}>
                        <HamburgerMenu onPress={toggleMenu} />
                        <View style={{ alignItems: 'center' }}>
                            {activeAccount?.type === 'personal' && (
                                <Text style={styles.accountType}>Personal Account</Text>
                            )}
                            {activeAccount?.type === 'team' && teamDetails && (
                                <View style={styles.teamInfoContainer}>
                                    <Text style={styles.accountType}>Team name: {teamDetails.name}</Text>
                                    <TouchableOpacity style={styles.teamCodeContainer} onPress={() => handleCopyCode(teamDetails.code)}>
                                        <Text style={styles.teamCodeText}>Team code: {teamDetails.code}</Text>
                                        <Feather name="copy" size={12} color="#6B7280" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <View style={{ width: 48 }} />
                    </View>

                    <View style={styles.greetingSection}>
                        <Text style={styles.mainTitle}>Hi, {userName} 👋</Text>
                    </View>

                    <View>
                        <Text style={styles.sectionTitle}>Actions</Text>
                        <View style={styles.actionsSlider}>
                            <ActionButton icon="layers" label="Stage 1" color="#ec4899" bg="#fce7f3" />
                            <Feather name="arrow-right" size={20} color="#9CA3AF" />
                            <TouchableOpacity onPress={() => router.push('/leads')}>
                                <ActionButton icon="user" label="Stage 2" color="#a78bfa" bg="#f5f3ff" />
                            </TouchableOpacity>
                            <Feather name="arrow-right" size={20} color="#9CA3AF" />
                            <TouchableOpacity onPress={() => router.push('/projects')}>
                                <ActionButton icon="clipboard" label="Stage 3" color="#60a5fa" bg="#eff6ff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.primaryActions}>
                        <LinearGradient
                            colors={['#2563EB', '#1D4ED8']}
                            style={styles.taskBar}
                        >
                            <Text style={styles.taskTitle}>Ongoing Tasks</Text>
                        </LinearGradient>
                    </View>
                    <View style={{ height: 16 }} />
                </>
            }
            renderItem={({ item }) => (
                <TaskCard task={item} onPress={() => handleTaskPress(item.id)} />
            )}
        />
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/assign-task')}>
            <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                style={styles.fabGradient}
            >
                <Feather name="plus" size={28} color="white" />
            </LinearGradient>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMenuVisible}
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity style={styles.menuOverlay} onPress={toggleMenu} activeOpacity={1}>
            <View style={styles.menuContainer}>
                <MenuScreen closeMenu={toggleMenu} user={user} />
            </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f9fafb' },
  mainContainer: {
    backgroundColor: 'white',
    flex: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  toast: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastSuccess: {
      backgroundColor: '#4CAF50',
  },
  toastError: {
      backgroundColor: '#F44336',
  },
  toastText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  accountType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  teamInfoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  teamCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamCodeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
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
  primaryActions: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  taskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  actionsSlider: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 60,
    height: 60,
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '500', color: '#4b5563' },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#f9fafb',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 100,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  taskInfoContainer: {
    flexShrink: 1,
    marginRight: 10
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  stageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
});

export default HomeScreen;
