import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import MenuScreen from './menu';

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

const OngoingTaskCard = ({ task }) => (
    <View style={styles.taskCard}>
        <View style={styles.taskCardHeader}>
            <View style={styles.taskIconContainer}>
                <MaterialCommunityIcons name="briefcase-check-outline" size={24} color="#4A5568" />
            </View>
            <Text style={styles.taskPriority}>Priority: {task.priority}</Text>
        </View>
        <Text style={styles.taskName}>{task.name}</Text>
        <View style={styles.taskFooter}>
            <Text style={styles.taskAssignee}>Assigned to {task.assignedToName}</Text>
        </View>
    </View>
);


const HomeScreen = () => {
  const router = useRouter();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('Guest');
  const [activeAccount, setActiveAccount] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [toastConfig, setToastConfig] = useState({ visible: false, message: '', type: 'success' });
  const toastTimeout = useRef(null);
  const [ongoingTasks, setOngoingTasks] = useState([]);


  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            const name = userDoc.exists() ? userDoc.data().firstName : (currentUser.displayName || currentUser.email.split('@')[0]);
            setUserName(name.charAt(0).toUpperCase() + name.slice(1));

            const storedActiveAccount = await AsyncStorage.getItem('activeAccount');
            const account = storedActiveAccount ? JSON.parse(storedActiveAccount) : { type: 'personal' };
            setActiveAccount(account);

            if (account.type === 'team') {
                const teamDocRef = doc(db, 'teams', account.id);
                const teamDoc = await getDoc(teamDocRef);
                if (teamDoc.exists()) {
                    setTeamDetails(teamDoc.data());
                }
            } else {
                setTeamDetails(null);
            }
        } else {
            setUser(null);
            setUserName('Guest');
            setActiveAccount(null);
            setTeamDetails(null);
            setOngoingTasks([]);
        }
    });

    return () => authUnsubscribe();
}, []);


  useEffect(() => {
    if (!user || !activeAccount) return;

    const isPersonal = activeAccount.type === 'personal';
    const tasksQuery = isPersonal
        ? query(collection(db, 'tasks'), where('assignedToId', '==', user.uid), where('teamId', '==', null))
        : query(collection(db, 'tasks'), where('teamId', '==', activeAccount.id));

    const tasksUnsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
        const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOngoingTasks(tasks);
    }, (error) => {
        console.error("Error fetching tasks: ", error);
        showToast('Error fetching tasks.', 'error');
    });

    return () => tasksUnsubscribe();
}, [user, activeAccount]);


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

  return (
    <SafeAreaView style={styles.body} edges={['top']}>
      <CustomToast visible={toastConfig.visible} message={toastConfig.message} type={toastConfig.type} />
      <View style={styles.mainContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <HamburgerMenu onPress={toggleMenu} />
              <View>
                {activeAccount?.type === 'personal' && (
                  <Text style={styles.accountType}>Personal Account</Text>
                )}
                {activeAccount?.type === 'team' && teamDetails && (
                  <View style={styles.teamInfoContainer}>
                    <Text style={styles.accountType}>{teamDetails.name}</Text>
                    <TouchableOpacity style={styles.teamCodeContainer} onPress={() => handleCopyCode(teamDetails.code)}>
                      <Text style={styles.teamCodeText}>{teamDetails.code}</Text>
                      <Feather name="copy" size={12} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.mainTitle}>Hi, {userName} 👋</Text>
          </View>

          <View style={styles.primaryActions}>
             <Text style={styles.sectionTitle}>Ongoing Tasks</Text>
               {ongoingTasks.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tasksSlider}>
                        {ongoingTasks.map(task => (
                            <OngoingTaskCard key={task.id} task={task} />
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.noTasksContainer}>
                        <Text style={styles.noTasksText}>No ongoing tasks at the moment.</Text>
                    </View>
                )}
          </View>
        </ScrollView>
        {activeAccount?.type === 'team' && (
          <TouchableOpacity style={styles.fab} onPress={() => router.push('/assign-task')}>
              <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  style={styles.fabGradient}
              >
                  <Feather name="plus" size={28} color="white" />
              </LinearGradient>
          </TouchableOpacity>
        )}
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
    top: 60,
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
  accountType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  teamInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  greetingSection: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  mainTitle: { fontSize: 30, fontWeight: '800', color: '#1e293b' },
  primaryActions: {
    paddingHorizontal: 24,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tasksSlider: {
    paddingRight: 24,
  },
  noTasksContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  noTasksText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 280,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
    justifyContent: 'space-between',
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskPriority: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskAssignee: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
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
});

export default HomeScreen;
