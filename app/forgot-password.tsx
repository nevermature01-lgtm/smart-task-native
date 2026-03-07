// 🔒 LOCKED SCREEN — DO NOT MODIFY

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

const COLORS = {
  primary: '#2563EB',
  danger: '#EF4444',
  backgroundLight: '#F8F9FA',
  backgroundDark: '#111827',
  white: '#ffffff',
  textLight: '#1F2937',
  textDark: '#F9FAFB',
};

const AppTextInput = ({ label, placeholder, value, onChangeText }) => {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    label: {
      color: COLORS.textLight,
      marginBottom: 8,
      fontWeight: '600',
      fontSize: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.white,
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: 'rgba(37, 99, 235, 0.2)',
      height: 56,
    },
    input: {
      flex: 1,
      color: COLORS.textLight,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={'rgba(31, 41, 55, 0.5)'}
          autoCapitalize="none"
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
};

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = () => {
    if (!email) {
      setError('Email is required.');
      return;
    }
    setLoading(true);
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'A password reset link has been sent to your email address.',
        });
        router.replace('/login');
      })
      .catch((error) => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: COLORS.backgroundLight,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    headerButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollView: {
      flexGrow: 1,
    },
    contentHeader: {
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      borderRadius: 999,
      padding: 16,
      marginBottom: 16,
    },
    contentHeaderTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.textLight,
      marginBottom: 8,
    },
    contentHeaderSubtitle: {
      color: 'rgba(31, 41, 55, 0.6)',
      textAlign: 'center',
      maxWidth: 300,
    },
    form: {
      paddingHorizontal: 24,
    },
    errorMessageContainer: {
      marginBottom: 16,
      backgroundColor: 'rgba(254, 226, 226, 1)',
      padding: 12,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorText: {
      color: COLORS.danger,
      fontWeight: '600',
      marginLeft: 8,
    },
    resetButton: {
      height: 56,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: COLORS.primary,
      marginTop: 16,
    },
    resetButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: 18,
    },
    footer: {
      padding: 24,
      alignItems: 'center',
    },
    footerText: {
      color: 'rgba(31, 41, 55, 0.6)',
    },
    footerLink: {
      fontWeight: '600',
      color: COLORS.primary,
    },
    gridPattern: {
      ...StyleSheet.absoluteFillObject,
      opacity: 0.05,
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <View style={styles.root}>
        <View style={styles.gridPattern} />
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => {
                if (router.canGoBack()) {
                    router.back();
                } else {
                    router.replace('/home');
                }
            }}>
                <Feather name="chevron-left" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={{width: 36}} />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}>
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.contentHeader}>
              <View style={styles.iconContainer}>
                <Feather name="lock" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.contentHeaderTitle}>Forgot Password</Text>
              <Text style={styles.contentHeaderSubtitle}>Enter your email to receive a password reset link</Text>
            </View>
            <View style={styles.form}>
              {error ? (
                <View style={styles.errorMessageContainer}>
                  <Feather name="alert-circle" size={24} color={COLORS.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <AppTextInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
              />
              <TouchableOpacity style={styles.resetButton} onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.resetButtonText}>{loading ? "Please wait..." : "Send Reset Link"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerText}>Back to <Text style={styles.footerLink}>Login</Text></Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default ForgotPasswordScreen;
