// =====================================================
// 🔒 AUTH SCREEN LOCKED
// DO NOT MODIFY THIS FILE UNLESS EXPLICITLY INSTRUCTED
// Any UI, layout, spacing, or logic change is forbidden.
// =====================================================

import React, { useState, useEffect } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { router, useLocalSearchParams } from 'expo-router';
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

const AppTextInput = ({ label, placeholder, isPassword, value, onChangeText }) => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);

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
    toggleButton: {
      marginLeft: 8,
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
          secureTextEntry={isPassword && !isPasswordVisible}
          autoCapitalize="none"
          value={value}
          onChangeText={onChangeText}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setPasswordVisible(!isPasswordVisible)} style={styles.toggleButton}>
            <MaterialIcons name={isPasswordVisible ? 'visibility-off' : 'visibility'} size={24} color={'rgba(31, 41, 55, 0.5)'} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.from === 'signup') {
      Toast.show({
        type: 'success',
        text1: 'Verification Email Sent',
        text2: 'Please check your inbox and verify your email to login.',
        visibilityTime: 5000,
      });
      router.replace('/login');
    }
  }, [params]);


  const handleLogin = () => {
    setLoading(true);
    setError('');
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user.emailVerified) {
          router.replace('/home');
        } else {
          sendEmailVerification(user).then(() => {
            setError('Your email is not verified. We have sent you a new verification link. Please check your inbox.');
            auth.signOut();
          });
        }
      })
      .catch((error) => {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            setError('The email or password you entered is incorrect. Please try again.');
        } else {
            setError('An unexpected error occurred. Please try again later.');
        }
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
      padding: 24,
      paddingTop: 40,
    },
    backButton: {
      height: 44,
      width: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.white,
      borderColor: 'rgba(37, 99, 235, 0.2)',
      borderWidth: 1,
    },
    headerTitleContainer: {
      alignItems: 'center',
    },
    headerTitle: {
      color: COLORS.textLight,
      fontWeight: 'bold',
      fontSize: 20,
    },
    headerSubtitle: {
      color: 'rgba(31, 41, 55, 0.6)',
      fontSize: 12,
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
      flex: 1,
    },
    loginButton: {
      height: 56,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: COLORS.primary,
      marginTop: 16,
    },
    loginButtonText: {
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
    forgotPasswordContainer: {
      alignItems: 'flex-end',
      marginBottom: 16,
    },
    forgotPasswordLink: {
      fontWeight: '600',
      color: COLORS.primary,
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <View style={styles.root}>
        <View style={styles.gridPattern} />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Smart Task</Text>
              <Text style={styles.headerSubtitle}>powered by Smart Decor</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}>
            <ScrollView contentContainerStyle={styles.scrollView}>
              <View style={styles.contentHeader}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="login" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.contentHeaderTitle}>Welcome Back</Text>
                <Text style={styles.contentHeaderSubtitle}>Log in to continue managing your tasks</Text>
              </View>
              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorMessageContainer}>
                    <MaterialIcons name="error-outline" size={24} color={COLORS.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <AppTextInput
                  label="Email Address"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                />
                <AppTextInput
                  label="Password"
                  placeholder="Enter your password"
                  isPassword={true}
                  value={password}
                  onChangeText={setPassword}
                />
                <View style={styles.forgotPasswordContainer}>
                  <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                    <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.loginButtonText}>{loading ? "Please wait..." : "Log In"}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.footer}>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={styles.footerText}>Don't have an account? <Text style={styles.footerLink}>Sign Up</Text></Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default LoginScreen;
