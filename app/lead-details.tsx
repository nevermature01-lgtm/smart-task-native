import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const LeadDetailsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lead Details</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/customer-details?id=${id}`)}>
            <Feather name="edit-2" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.mainContent}>
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
             {lead.measurements && lead.measurements.length > 0 && (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Measurements</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {lead.measurements.map((uri, index) => (
                            <Image key={index} source={{ uri }} style={styles.measurementImage} />
                        ))}
                    </ScrollView>
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
        color: '#0a7ea4',
        textDecorationLine: 'underline',
    },
    measurementImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
    }
});

export default LeadDetailsScreen;