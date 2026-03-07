import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const WorkCompleteDetailsScreen = () => {
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
          Alert.alert("Error", "Work complete not found.");
        }
        setIsLoading(false);
      }, error => {
        console.error("Error fetching work complete details: ", error);
        Alert.alert("Error", "Failed to fetch work complete details.");
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
      Alert.alert("No Contact", "No contact number is available for this work complete.");
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Work complete not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Complete Details</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/edit-work-complete-details?id=${id}`)}>
            <Feather name="edit-2" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="never"
        scrollEventThrottle={16}
        decelerationRate="fast"
        contentContainerStyle={[styles.mainContent, { paddingBottom: 40 }]}
      >
        <View style={styles.detailCard}>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer Name</Text>
                <Text style={styles.detailValue}>{visit.customerName}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{visit.address}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact Number</Text>
                <TouchableOpacity onPress={() => handleCall(visit.contactNumber)}>
                    <Text style={[styles.detailValue, styles.linkValue]}>{visit.contactNumber}</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Follow-up Date</Text>
                <Text style={styles.detailValue}>{visit.followUpDate}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source</Text>
                <Text style={styles.detailValue}>{visit.source}</Text>
            </View>
             <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Stage</Text>
                <Text style={styles.detailValue}>{visit.stage}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remark</Text>
                <Text style={styles.detailValue}>{visit.remark}</Text>
            </View>
            {visit.workCompleteURL && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Work Complete Form</Text>
                {visit.workCompleteURL.includes('.pdf') ? (
                  <TouchableOpacity onPress={() => Linking.openURL(visit.workCompleteURL)}>
                    <View style={styles.pdfPreview}>
                        <Feather name="file" size={40} color="#10B981" />
                        <Text style={styles.pdfName} numberOfLines={1}>{visit.workCompleteURL.split('F').pop().split('?')[0]}</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <Image source={{ uri: visit.workCompleteURL }} style={styles.image} />
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

export default WorkCompleteDetailsScreen;
