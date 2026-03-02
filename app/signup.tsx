import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { router } from 'expo-router';

const COLORS = {
  primary: '#2563EB',
  danger: '#EF4444',
  backgroundLight: '#F8F9FA',
  backgroundDark: '#111827',
  white: '#ffffff',
  textLight: '#1F2937',
  textDark: '#F9FAFB',
};

const AppTextInput = ({ label, placeholder, isPassword, value, onChangeText, containerStyle }) => {
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
    <View style={[styles.container, containerStyle]}>
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

const SignupScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        sendEmailVerification(user).then(() => {
          alert('A verification email has been sent to your email address. Please verify your email before logging in.');
          router.replace('/login');
        });
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: COLORS.backgroundLight,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 24,
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
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    signupButton: {
      height: 56,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: COLORS.primary,
      marginTop: 16,
    },
    signupButtonText: {
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
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.gridPattern} />
      <SafeAreaView style={styles.safeArea}>
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
                <MaterialIcons name="person-add-alt-1" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.contentHeaderTitle}>Create Account</Text>
              <Text style={styles.contentHeaderSubtitle}>Join our community of smart task managers</Text>
            </View>
            <View style={styles.form}>
              {error ? (
                <View style={styles.errorMessageContainer}>
                  <MaterialIcons name="error-outline" size={24} color={COLORS.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              <View style={styles.nameRow}>
                <AppTextInput
                  label="First Name"
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  containerStyle={{ flex: 1, marginRight: 8 }}
                />
                <AppTextInput
                  label="Last Name"
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  containerStyle={{ flex: 1, marginLeft: 8 }}
                />
              </View>
              <AppTextInput
                label="Email Address"
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
              />
              <AppTextInput
                label="Password"
                placeholder="Password"
                isPassword={true}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
                  <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink}>Login</Text></Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default SignupScreen;
