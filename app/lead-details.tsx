import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import ImageView from 'react-native-image-viewing';

const LeadDetailsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      const leadRef = doc(db, 'leads', id);
      const unsubscribe = onSnapshot(leadRef, (docSnap) => {
        if (docSnap.exists()) {
          setLead({ id: docSnap.id, ...docSnap.data() });
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
      const url = `tel:${phoneNumber}`;
      Linking.canOpenURL(url)
        .then(supported => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            Alert.alert("Error", "Unable to make a phone call.");
          }
        })
        .catch(() => Alert.alert("Error", "Unable to make a phone call."));
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

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Lead not found.</Text>
      </View>
    );
  }

  const stageNumMatch = lead.stage ? lead.stage.match(/(\d+)/) : null;
  const stageNum = stageNumMatch ? parseInt(stageNumMatch[1], 10) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/edit-lead?id=${id}`)}>
            <Feather name="edit-2" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.mainContent}>
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
                                if (form.type === 'image') {
                                    const imageForms = lead.customerApprovalForms.filter(f => f.type === 'image');
                                    const imageIndex = imageForms.findIndex(imgForm => imgForm.url === form.url);
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
