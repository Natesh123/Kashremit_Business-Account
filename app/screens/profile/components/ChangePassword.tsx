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
            <View style={{ flexDirection: 'row', marginBottom:10, alignItems: "center", justifyContent: "space-between"}}>
              <View>
                  <Text style={styles.header}>Change password</Text>
              </View>
              <View>
                   
              </View>
            </View> 
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                    Password
                </Text>
                <View style={styles.inputControls}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Password"
                        placeholderTextColor={theme.colors.black50}
                        returnKeyType="done"
                        value={password.value}
                        onChangeText={handlePasswordChange}
                        secureTextEntry={!isPasswordSecure}
                    />
                    <Vector
                        as="materialcommunityicons"
                        name={isPasswordSecure ? 'eye' : 'eye-off'}
                        size={30}
                        color={theme.colors.black50}
                        onPress={onIsPasswordSecure}
                        style={{ marginLeft: 10, }}
                    />
                </View>
                {password.error ? <Text style={styles.error}>{password.error}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                    New password
                </Text>
                <View style={styles.inputControls}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="New password"
                        placeholderTextColor={theme.colors.black50}
                        returnKeyType="done"
                        value={newPassword.value}
                        onChangeText={handleNewPasswordChange}
                        secureTextEntry={!isNewPasswordSecure}
                    />
                    <Vector
                        as="materialcommunityicons"
                        name={isNewPasswordSecure ? 'eye' : 'eye-off'}
                        size={30}
                        color={theme.colors.black50}
                        onPress={onIsNewPasswordSecure}
                        style={{ marginLeft: 10, }}
                    />
                </View>
                {newPassword.error ? <Text style={styles.error}>{newPassword.error}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                    Confirm Password
                </Text>
                <View style={styles.inputControls}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Confirm password"
                        placeholderTextColor={theme.colors.black50}
                        returnKeyType="done"
                        value={confirmPassword.value}
                        onChangeText={handleConfirmPasswordChange}
                        secureTextEntry={!isConfirmPasswordSecure}
                    />
                    <Vector
                        as="materialcommunityicons"
                        name={isConfirmPasswordSecure ? 'eye' : 'eye-off'}
                        size={30}
                        color={theme.colors.black50}
                        onPress={onIsConfirmPasswordSecure}
                        style={{ marginLeft: 10, }}
                    />
                </View>
                {confirmPassword.error ? <Text style={styles.error}>{confirmPassword.error}</Text> : null}
            </View>

            <View style={{
                flexDirection: "row",
                justifyContent: "space-around",
                alignItems: "flex-end",
                marginTop: 40,
                width: "100%"
            }}>

                <Button style={{ minWidth: '40%' }} onPress={onChangePassword}>
                    Change Password
                </Button>

            </View>


        </View>
    );
};

export default ChangePassword;
