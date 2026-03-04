import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
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
        <Feather name={icon} size={32} color={color} />
      </View>
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const TaskCard = ({ task, onPress }) => {
    const { name, priority, dueDate, createdAt } = task;

    const getPriorityColor = (p) => {
        const priorityValue = Number(p);
        switch (priorityValue) {
            case 1:
                return '#EF4444'; // High
            case 2:
                return '#F97316'; // Medium
            case 3:
                return '#22C55E'; // Low
            default:
                return '#6B7280'; // Other priorities
        }
    };

    const priorityColor = getPriorityColor(priority);

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
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>{`P${priority}`}</Text>
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

          const teamMembersRef = collection(db, 'team_members');
          const memberQuery = query(teamMembersRef, where("teamId", "==", account.id), where("userId", "==", currentUser.uid));
          const memberSnapshot = await getDocs(memberQuery);

          let userRole = 'member';
          if (!memberSnapshot.empty) {
            userRole = memberSnapshot.docs[0].data().role;
          }

          if (userRole === 'admin') {
            tasksQuery = query(tasksCollectionRef, where('teamId', '==', account.id));
          } else {
            tasksQuery = query(tasksCollectionRef, where('teamId', '==', account.id), where('assignedToId', '==', currentUser.uid));
          }

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
        if (unsubscribeTasks) {
            unsubscribeTasks();
        }
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          <View style={styles.header}>
            <HamburgerMenu onPress={toggleMenu} />
            <View style={{alignItems: 'center'}}>
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
            <View style={{width: 48}}/>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.mainTitle}>Hi, {userName} 👋</Text>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionsSlider}>
              <ActionButton icon="check-square" label="Tasks" color="#ec4899" bg="#fce7f3" />
              <TouchableOpacity onPress={() => router.push('/leads')}>
                <ActionButton icon="users" label="Leads" color="#a78bfa" bg="#f5f3ff" />
              </TouchableOpacity>
              <ActionButton icon="briefcase" label="Projects" color="#60a5fa" bg="#eff6ff" />
              <ActionButton icon="dollar-sign" label="Finance" color="#fb923c" bg="#fff7ed" />
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

          <View style={{paddingHorizontal: 24, marginTop: 16, gap: 12}}>
            {tasks.map(task => (
                <TaskCard key={task.id} task={task} onPress={() => handleTaskPress(task.id)} />
            ))}
          </View>

        </ScrollView>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  actionItem: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
    bottom: 60,
    right: 30,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default HomeScreen;