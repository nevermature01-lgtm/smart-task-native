import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DispatchDetailsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [visit, setVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      const visitRef = doc(db, 'leads', id);
      const unsubscribe = onSnapshot(visitRef, (docSnap) => {
        if (docSnap.exists()) {
          setVisit({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert("Error", "Visit not found.");
          setVisit(null);
        }
        setIsLoading(false);
      }, error => {
        console.error("Error fetching visit details: ", error);
        Alert.alert("Error", "Failed to fetch visit details.");
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
      Alert.alert("No Contact", "No contact number is available for this visit.");
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!visit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Dispatch Details</Text>
            <View style={{width: 36}} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Visit not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispatch Details</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/edit-dispatch-details?id=${id}`)}>
            <Feather name="edit-2" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.detailCard}>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer Name</Text>
                <Text style={styles.detailValue}>{visit.customerName || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{visit.address || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <TouchableOpacity onPress={() => handleCall(visit.contactNumber)}>
                    <Text style={[styles.detailValue, styles.linkValue]}>{visit.contactNumber || 'N/A'}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Follow-up Date</Text>
                <Text style={styles.detailValue}>{visit.followUpDate || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source</Text>
                <Text style={styles.detailValue}>{visit.source || 'N/A'}</Text>
            </View>
             <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stage</Text>
                <Text style={styles.detailValue}>{visit.stage || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remark</Text>
                <Text style={styles.detailValue}>{visit.remark || 'N/A'}</Text>
            </View>
            {visit.approvalFormURL && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer Approval Form</Text>
                {visit.approvalFormURL.includes('.pdf') ? (
                  <TouchableOpacity onPress={() => Linking.openURL(visit.approvalFormURL)}>
                    <View style={styles.pdfPreview}>
                        <Feather name="file" size={40} color="#10B981" />
                        <Text style={styles.pdfName} numberOfLines={1}>{visit.approvalFormURL.split('F').pop().split('?')[0]}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Image source={{ uri: visit.approvalFormURL }} style={styles.image} />
                )}
              </View>
            )}
        </View>
      </ScrollView>
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
        color: '#10B981',
        textDecorationLine: 'underline',
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginTop: 8,
    },
    pdfPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8
    },
    pdfName: {
        marginLeft: 12,
        fontSize: 14,
        flex: 1
    }
});

export default DispatchDetailsScreen;
