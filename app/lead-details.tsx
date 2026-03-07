import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert, Image, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import ImageView from 'react-native-image-viewing';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LeadDetailsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userRole, setUserRole] = useState('member');

  useEffect(() => {
    const getUserRole = async () => {
      const authUser = auth.currentUser;
      if (!authUser) return;

      const accountJson = await AsyncStorage.getItem('activeAccount');
      if (accountJson) {
        const account = JSON.parse(accountJson);
        if (account.type === 'personal') {
          setUserRole('admin');
        } else if (account.id) {
          const teamMembersQuery = query(
            collection(db, 'team_members'),
            where('teamId', '==', account.id),
            where('userId', '==', authUser.uid)
          );
          const memberSnapshot = await getDocs(teamMembersQuery);
          if (!memberSnapshot.empty) {
            setUserRole(memberSnapshot.docs[0].data().role);
          }
        }
      }
    };

    getUserRole();

    if (id) {
      setIsLoading(true);
      const leadRef = doc(db, 'leads', id);
      const unsubscribe = onSnapshot(leadRef, (docSnap) => {
        if (docSnap.exists()) {
          const leadData = { id: docSnap.id, ...docSnap.data() };
          setLead(leadData);
          setIsCompleted(leadData.stage === 'Completed');
        } else {
          Alert.alert("Error", "Lead not found.");
        }
        setIsLoading(false);
      }, error => {
        console.error("Error fetching lead details: ", error);
        Alert.alert("Error", "Failed to fetch lead details.");
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, [id]);

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`).catch(() => Alert.alert("Error", "Unable to make a phone call."));
    } else {
      Alert.alert("No Contact", "No contact number is available for this lead.");
    }
  };
  
  const openImageViewer = (images, index, isApprovalForm = false) => {
      const formattedImages = images.map(img => ({ uri: isApprovalForm ? img.url : img }));
      setViewerImages(formattedImages);
      setViewerIndex(index);
      setIsViewerVisible(true);
  }

  const handleReopen = async () => {
    if (!lead) return;
    Alert.alert(
        "Reopen Lead",
        `Are you sure you want to reopen this lead? It will be moved back to Stage 8.`,
        [
            { text: "Cancel", style: "cancel" },
            { text: "Reopen", style: "destructive", onPress: async () => {
                try {
                    const leadRef = doc(db, 'leads', id);
                    await updateDoc(leadRef, { stage: 'Stage 8' });
                    Alert.alert("Success", "Lead has been reopened.");
                    router.replace(`/leads?stage=Stage 8`);
                } catch (error) {
                    console.error("Error reopening lead: ", error);
                    Alert.alert("Error", "Failed to reopen lead. Please try again.");
                }
            }}
        ]
    );
  };

  const toggleCompletion = async () => {
    if (!lead) return;
    const newStatus = !isCompleted;
    const newStage = newStatus ? 'Completed' : 'Stage 8';

    setIsCompleted(newStatus);

    try {
        const leadRef = doc(db, 'leads', id);
        await updateDoc(leadRef, {
            stage: newStage,
        });
        if (newStatus) {
            router.push('/all-customers');
        }
    } catch (error) {
        console.error("Error updating completion status: ", error);
        setIsCompleted(!newStatus);
        Alert.alert("Error", "Failed to update status. Please try again.");
    }
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0a7ea4" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
  }

  if (!lead) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Lead not found.</Text></View>;
  }

  const stageNum = lead.stage === 'Completed' ? 8 : (lead.stage?.match(/(\d+)/) ? parseInt(lead.stage.match(/(\d+)/)[1], 10) : 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        {lead.stage === 'Completed' ? (
          userRole === 'admin' ? (
            <TouchableOpacity style={styles.headerButton} onPress={handleReopen}>
              <Feather name="unlock" size={20} color="#1F2937" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerButton}>
              <Feather name="lock" size={20} color="#1F2937" />
            </View>
          )
        ) : (
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/edit-lead?id=${id}`)}>
            <Feather name="edit-2" size={20} color="#1F2937" />
          </TouchableOpacity>
        )}
      </View>
      <ScrollView contentContainerStyle={[styles.mainContent, { paddingBottom: 40 }]}>
        {stageNum >= 4 && (
            <View style={styles.amountCard}>
                <View style={styles.amountStat}>
                    <Text style={styles.amountLabel}>Token Amount</Text>
                    <Text style={styles.amountValue}>{`₹${lead.tokenAmount || '0'}`}</Text>
                </View>
                {stageNum >= 5 && (
                    <View style={styles.amountStat}>
                        <Text style={styles.amountLabel}>Running Payment</Text>
                        <Text style={styles.amountValue}>{`₹${lead.runningPayment || '0'}`}</Text>
                    </View>
                )}
                <View style={styles.amountStat}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>{`₹${lead.totalAmount || '0'}`}</Text>
                </View>
            </View>
        )}
        {stageNum >= 7 && (
          <View style={styles.amountCard}>
            <View style={styles.amountStat}>
                <Text style={styles.amountLabel}>Full Payment</Text>
                <Text style={styles.amountValue}>{`₹${lead.fullPayment || '0'}`}</Text>
            </View>
          </View>
        )}
        {stageNum >= 8 && (
             <View style={styles.completeButtonCard}>
                <Text style={styles.customerNameText}>{lead.customerName}</Text>
                <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>Mark as Complete</Text>
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={isCompleted ? "#f5dd4b" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleCompletion}
                        value={isCompleted}
                        disabled={lead.stage === 'Completed'}
                    />
                </View>
            </View>
        )}
        <View style={styles.detailCard}>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer Name</Text>
                <Text style={styles.detailValue}>{lead.customerName}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{lead.address}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <TouchableOpacity onPress={() => handleCall(lead.contactNumber)}>
                    <Text style={[styles.detailValue, styles.linkValue]}>{lead.contactNumber}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Follow-up Date</Text>
                <Text style={styles.detailValue}>{lead.followUpDate}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source</Text>
                <Text style={styles.detailValue}>{lead.source}</Text>
            </View>
             <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stage</Text>
                <Text style={styles.detailValue}>{lead.stage}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remark</Text>
                <Text style={styles.detailValue}>{lead.remark}</Text>
            </View>
             {lead.assignedTo && lead.assignedTo.length > 0 && (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Assigned To</Text>
                    <Text style={styles.detailValue}>{lead.assignedTo.map(u => u.name).join(', ')}</Text>
                </View>
            )}
            {stageNum >= 3 && (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Measurements</Text>
                    {lead.measurementImages && lead.measurementImages.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {lead.measurementImages.map((uri, index) => (
                                 <TouchableOpacity key={index} onPress={() => openImageViewer(lead.measurementImages, index)}>
                                    <Image source={{ uri }} style={styles.measurementImage} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : <Text style={styles.detailValue}>-</Text>}
                </View>
            )}
            {stageNum >= 4 && (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer Approval Form</Text>
                    {lead.customerApprovalForms && lead.customerApprovalForms.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {lead.customerApprovalForms.map((form, index) => {
                                const imageForms = lead.customerApprovalForms.filter(f => f.type === 'image');
                                const imageIndex = imageForms.findIndex(imgForm => imgForm.url === form.url);
                                if (form.type === 'image') {
                                    return (
                                        <TouchableOpacity key={index} onPress={() => openImageViewer(imageForms, imageIndex, true)}>
                                            <Image source={{ uri: form.url }} style={styles.measurementImage} />
                                        </TouchableOpacity>
                                    );
                                } else if (form.type === 'pdf') {
                                    return (
                                        <TouchableOpacity key={index} onPress={() => Linking.openURL(form.url)}>
                                            <View style={[styles.measurementImage, styles.pdfPreview]}>
                                                <Feather name="file-text" size={40} color="#374151" />
                                                <Text style={styles.pdfName} numberOfLines={2}>{form.name}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }
                                return null;
                            })}
                        </ScrollView>
                    ) : <Text style={styles.detailValue}>-</Text>}
                </View>
            )}
            {stageNum >= 5 && (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Project Details Form</Text>
                    {lead.projectImages && lead.projectImages.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {lead.projectImages.map((uri, index) => (
                                 <TouchableOpacity key={index} onPress={() => openImageViewer(lead.projectImages, index)}>
                                    <Image source={{ uri }} style={styles.measurementImage} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : <Text style={styles.detailValue}>-</Text>}
                </View>
            )}
            {stageNum >= 6 && (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Dispatch</Text>
                    {lead.dispatchImages && lead.dispatchImages.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {lead.dispatchImages.map((uri, index) => (
                                 <TouchableOpacity key={index} onPress={() => openImageViewer(lead.dispatchImages, index)}>
                                    <Image source={{ uri }} style={styles.measurementImage} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : <Text style={styles.detailValue}>-</Text>}
                </View>
            )}
            {stageNum >= 7 && (
              <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Work Complete</Text>
                  <Text style={styles.detailValue}>{lead.workComplete ? 'Yes' : 'No'}</Text>
              </View>
            )}
            {stageNum >= 8 && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Feedback</Text>
                  <Text style={styles.detailValue}>{lead.feedback || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Complaint</Text>
                  <Text style={styles.detailValue}>{lead.complaint || '-'}</Text>
                </View>
              </>
            )}
        </View>
      </ScrollView>
      <ImageView
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    mainContent: {
        padding: 20,
    },
    amountCard: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 3,
    },
    amountStat: {
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    amountValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    completeButtonCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 3,
    },
    customerNameText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 10,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    switchLabel: {
        fontSize: 16,
        color: '#374151',
    },
    detailCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 3,
    },
    detailRow: {
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        color: '#1F2937',
    },
    linkValue: {
        color: '#0a7ea4',
        textDecorationLine: 'underline',
    },
    measurementImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
    },
    pdfPreview: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 5,
    },
    pdfName: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    }
});

export default LeadDetailsScreen;
