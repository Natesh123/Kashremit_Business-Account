import { View, Text, ViewStyle, ScrollView, RefreshControl, Dimensions, TextInput } from "react-native";
import React, { useEffect, useState } from "react";
import { theme } from "app/core/theme";
import styles from "app/styles";
import { TextInput as Input } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import Vector from "app/assets/vectors";
import Button from "app/components/controls/Button";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { PutChangePassword } from "app/http-services";
import Toast from "react-native-toast-message";
import { confirmPasswordValidator, passwordValidator } from "app/core/utils";

type Props = {
    profile: any,
    style?: ViewStyle
};

const ChangePassword = ({ profile, style }: Props) => {
    const [loading, setLoading] = useState(false);
    const currentToken = useRecoilValue(ProfileState);
    const [isFormValid, setIsFormValid] = useState(false);

    const [password, setPassword] = useState({ value: '', error: '' });
    const [newPassword, setNewPassword] = useState({ value: '', error: '' });
    const [confirmPassword, setConfirmPassword] = useState({ value: '', error: '' });

    const [isPasswordSecure, setIsPasswordSecure] = useState(false);
    const [isNewPasswordSecure, setIsNewPasswordSecure] = useState(false);
    const [isConfirmPasswordSecure, setIsConfirmPasswordSecure] = useState(false);

    const navigation = useNavigation();

    const onIsPasswordSecure = () => {
        setIsPasswordSecure(!isPasswordSecure);
    };

    const onIsNewPasswordSecure = () => {
        setIsNewPasswordSecure(!isNewPasswordSecure);
    };

    const onIsConfirmPasswordSecure = () => {
        setIsConfirmPasswordSecure(!isConfirmPasswordSecure);
    };


    const handlePasswordChange = (input: string) => {
        const passwordError = passwordValidator(input);
        if (passwordError) {
            setPassword({ value: input, error: passwordError })
        } else {
            setPassword({ value: input, error: '' })
        }
    }

    const handleNewPasswordChange = (input: string) => {
        const passwordError = passwordValidator(input);
        if (passwordError) {
            setNewPassword({ value: input, error: passwordError })
        } else {
            setNewPassword({ value: input, error: '' })
        }
    }

    const handleConfirmPasswordChange = (input: string) => {
        const passwordError = confirmPasswordValidator(newPassword.value, input);
        if (passwordError) {
            setConfirmPassword({ value: input, error: passwordError })
        } else {
            setConfirmPassword({ value: input, error: '' })
        }
    }

    const onChangePassword = () => {
        try {
            setLoading(true); 
            const passwordError = passwordValidator(password.value);
            const newPasswordError = passwordValidator(newPassword.value);
            const confirmPasswordError = confirmPasswordValidator(newPassword.value,confirmPassword.value);

            if (passwordError || newPasswordError || confirmPasswordError) {
               
                setPassword({ ...password, error: passwordError });
                setNewPassword({ ...newPassword, error: newPasswordError });
                setConfirmPassword({ ...confirmPassword, error: confirmPasswordError });

                setLoading(false)
                Toast.show({
                    type: 'error',
                    text1: 'Change password',
                    text2: 'We need a valid input'
                });
                return;

            }
            const request = {
                tokenId: currentToken.tokenId,
                remitterId: currentToken.remitterId,
                newPassword: newPassword.value,
                oldPassword: confirmPassword.value,

            }
            const response = PutChangePassword(request);
            response.then((res: any) => {
                if (res.status === 200) {
                    Toast.show({
                        type: 'success',
                        text1: 'Change password',
                        text2: 'Password updated successfully'
                    });
                }
            })
                .catch((err) => {
                    console.error('Change password', err.response?.data?.message)
                    Toast.show({
                        type: 'error',
                        text1: 'Change password',
                        text2: 'An internal error occurred. Please try again later'
                    });
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error fetching Transaction details:', error);
            Toast.show({
                type: 'error',
                text1: 'Change password',
                text2: 'An internal error occurred. Please try again later'
            });
        }
    };

    return (
        <View style={[style, {padding:20,  overflow: 'scroll'}]}>
            <View style={{ marginTop: 4, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#316b83', letterSpacing: 0.5 }}>Security Settings</Text>
                    <Vector as="ionicons" name="lock-closed-outline" size={18} color="#316b83" style={{ marginLeft: 8 }} />
                </View>
                <View style={{ height: 1, backgroundColor: '#E5E7EB', width: '100%' }} />
            </View> 
            <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
                {/* Current Password Row */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '500' }}>Current Password</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={{ flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' }}
                            placeholder="Enter current password"
                            placeholderTextColor="#9CA3AF"
                            returnKeyType="done"
                            value={password.value}
                            onChangeText={handlePasswordChange}
                            secureTextEntry={!isPasswordSecure}
                        />
                        <Vector
                            as="materialcommunityicons"
                            name={isPasswordSecure ? 'eye' : 'eye-off'}
                            size={24}
                            color="#9CA3AF"
                            onPress={onIsPasswordSecure}
                            style={{ marginLeft: 10 }}
                        />
                    </View>
                    {password.error ? <Text style={styles.error}>{password.error}</Text> : null}
                </View>

                {/* New Password Row */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '500' }}>New Password</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={{ flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' }}
                            placeholder="Enter new password"
                            placeholderTextColor="#9CA3AF"
                            returnKeyType="done"
                            value={newPassword.value}
                            onChangeText={handleNewPasswordChange}
                            secureTextEntry={!isNewPasswordSecure}
                        />
                        <Vector
                            as="materialcommunityicons"
                            name={isNewPasswordSecure ? 'eye' : 'eye-off'}
                            size={24}
                            color="#9CA3AF"
                            onPress={onIsNewPasswordSecure}
                            style={{ marginLeft: 10 }}
                        />
                    </View>
                    {newPassword.error ? <Text style={styles.error}>{newPassword.error}</Text> : null}
                </View>

                {/* Confirm Password Row */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '500' }}>Confirm Password</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={{ flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' }}
                            placeholder="Confirm new password"
                            placeholderTextColor="#9CA3AF"
                            returnKeyType="done"
                            value={confirmPassword.value}
                            onChangeText={handleConfirmPasswordChange}
                            secureTextEntry={!isConfirmPasswordSecure}
                        />
                        <Vector
                            as="materialcommunityicons"
                            name={isConfirmPasswordSecure ? 'eye' : 'eye-off'}
                            size={24}
                            color="#9CA3AF"
                            onPress={onIsConfirmPasswordSecure}
                            style={{ marginLeft: 10 }}
                        />
                    </View>
                    {confirmPassword.error ? <Text style={styles.error}>{confirmPassword.error}</Text> : null}
                </View>
            </View>

            <View style={{ marginTop: 24, marginBottom: 40, width: "100%" }}>
                <Button onPress={onChangePassword}>
                    Update Password
                </Button>
            </View>


        </View>
    );
};

export default ChangePassword;
