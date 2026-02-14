
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import Notification from '../components/Notification';

const SignUp = ({ onBack, onLogIn }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, message: '', type: '' });

    const colors = {
        primary: "#ec5b13",
        backgroundLight: "#f8f6f6",
        textDark: "#221610",
        textMuted: "rgba(34, 22, 16, 0.6)",
    };

    const showNotification = (message, type) => {
        setNotification({ visible: true, message, type });
        setTimeout(() => {
            setNotification({ visible: false, message: '', type: '' });
        }, 3000);
    };

    const handleSignUp = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });

        if (error) {
            if (error.message === "User already registered") {
                showNotification("Email already exists, try a different one", "error");
            } else {
                showNotification(error.message, "error");
            }
        } else {
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                showNotification("Email already exists, try a different one", "error");
            } else {
                showNotification('Verification mail sent', 'success');
                setTimeout(() => {
                    onLogIn();
                }, 2000);
            }
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={[styles.body, { backgroundColor: colors.backgroundLight }]}>
            <StatusBar hidden />
            {notification.visible && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onHide={() => setNotification({ visible: false, message: '', type: '' })}
                />
            )}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={styles.mainContainer}>
                        {/* Navigation */}
                        <View style={styles.nav}>
                            <TouchableOpacity onPress={onBack}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textDark} />
                            </TouchableOpacity>
                            <View style={styles.logoContainer}>
                                <Text style={[styles.logoText, { color: colors.textDark }]}>Smart Task</Text>
                                <Text style={[styles.logoSubText, { color: colors.textMuted }]}>Powered by Smart Decor</Text>
                            </View>
                            <View style={{ width: 24 }} />
                        </View>

                        {/* Header Section */}
                        <View style={styles.headerSection}>
                            <View style={styles.headerIconContainer}>
                                <MaterialCommunityIcons name="rocket-launch" size={40} color={colors.primary} />
                            </View>
                            <Text style={[styles.title, { color: colors.textDark }]}>Join the Masters</Text>
                            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create an account to master your workflow</Text>
                        </View>

                        {/* Sign Up Form */}
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons name="account-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor={colors.textMuted}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="name@example.com"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="email-address"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="8+ characters"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleSignUp} disabled={loading}>
                                <Text style={styles.primaryButtonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer Link */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={onLogIn}>
                                <Text style={{ color: colors.textMuted }}>
                                    Already have an account?{' '}
                                    <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                                        Log In
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    body: {
        flex: 1,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        paddingBottom: 16,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logoText: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    logoSubText: {
        fontSize: 12,
        fontWeight: '600',
    },
    headerSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    headerIconContainer: {
        backgroundColor: 'rgba(236, 91, 19, 0.1)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 8,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#221610',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
    },
    primaryButton: {
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
});

export default SignUp;
