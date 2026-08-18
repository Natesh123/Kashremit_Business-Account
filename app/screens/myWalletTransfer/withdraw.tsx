import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRecoilValue } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";

import { ProfileState } from "../../atoms";
import { GetWalletBalance, WalletWithdrawal } from "app/http-services";
import { FONTS, SIZES } from "../../constants/Assets";
import { theme } from "../../core/theme";

import HomeHeader from "app/components/HomeHeader";
import Container from "app/theme/Container";
import ToastConfig from "app/components/ToastConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const Withdraw = () => {
    const navigation = useNavigation();
    const currentToken = useRecoilValue(ProfileState);
    const isFocused = useIsFocused();

    const [currency, setCurrency] = useState("£");
    const [accountBalance, setAccountBalance] = useState("0.00");
    const [withdrawAccountBalance, setWithdrawAccountBalance] = useState("0.00");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [availableBalance, setAvailableBalance] = useState("0.00");
    const isConfirmDisabled = !amount || parseFloat(amount) <= 0;


    useEffect(() => {
        const _currency = process.env.CURRENCY_SYMBOL || "£";
        setCurrency(_currency);
        fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
    }, [isFocused]);

    const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const res = await GetWalletBalance(tokenId);
            if (res?.status === 200) {
                setAccountBalance(res?.data?.BalanceAmount || "0.00"); // total balance
                setAvailableBalance(res?.data?.BalanceAmount || "0.00"); // available for withdrawal
                setWithdrawAccountBalance(res?.data?.WD_BalanceAmount || "0.00"); // optional if needed separately
            }
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setToastMsg("Please enter a valid amount");
            setShowToast(true);
            return;
        }

        try {
            setLoading(true);

            const reqPayload = {
                Amount: amount,
            };

            const response = await WalletWithdrawal(reqPayload);

            const statusCode = response?.data?.statusCode || response?.data?.StatusCode || response?.status;

            if (statusCode === "ER0077" || statusCode === "ER0077".toString()) {
                setToastMsg("Withdrawal submitted successfully");
                setShowToast(true);

                const userData = await AsyncStorage.getItem('user');
                const parsedUser = userData ? JSON.parse(userData) : null;
                const tokenId = parsedUser?.tokenId || null;
                const remitterId = parsedUser?.remitterId || null;
                fetchWalletBalance(tokenId, remitterId);

                setAmount("");


            } else {
                setToastMsg(response?.data?.message || "Withdrawal failed");
                setShowToast(true);
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
            setToastMsg("Something went wrong. Please try again.");
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={style.container}>
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
                <View style={style.headerContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={style.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={style.headerTitle}>Withdraw from my wallet</Text>
                </View>
            </SafeAreaView>
            <Container style={{ backgroundColor: '#F2F2F7', flex: 1 }}>
                <ScrollView contentContainerStyle={style.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={style.card}>
                        <Text style={style.label}>Enter the Amount to withdraw</Text>

                        <View style={style.inputWrapper}>
                            <View style={style.currencyBadge}>
                                <Text style={style.currencyText}>GBP</Text>
                            </View>
                            <TextInput
                                style={style.input}
                                placeholder="Enter Amount"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={(text) => {
                                    const cleaned = text.replace(/[^0-9.]/g, "");
                                    const valid = cleaned.split(".").length > 2
                                        ? cleaned.slice(0, -1)
                                        : cleaned;
                                    setAmount(valid);
                                }}
                            />
                        </View>

                        <View style={style.balanceBox}>
                            <Ionicons name="wallet-outline" size={18} color="#316b83" />
                            <Text style={style.balanceText}>
                                Available Balance: <Text style={{ fontFamily: FONTS.bold, color: '#111827' }}>£ {availableBalance}</Text>
                            </Text>
                        </View>

                        <Text style={style.note}>
                            * User can withdraw money only paid for the transactions.
                        </Text>

                        {loading && <ActivityIndicator size="large" color="#316b83" style={{ marginVertical: 10 }} />}

                        <View style={style.buttonRow}>
                            <TouchableOpacity style={[style.button, style.cancelButton]} onPress={() => navigation.goBack()}>
                                <Text style={style.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[style.button, style.confirmButton, isConfirmDisabled && { opacity: 0.5 }]} onPress={handleConfirm} disabled={isConfirmDisabled}>
                                <Text style={style.confirmText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </Container>
            <ToastConfig
                visible={showToast}
                message={"Required amount withdrawal is under processing"}
                onClose={() => {
                    setShowToast(false);
                    navigation.navigate("MyWalletTransfer");
                }}
            />
        </View>
    );
};

const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2F2F7",
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
        backgroundColor: "#316b83",
    },
    backButton: {
        padding: 4,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: FONTS.bold,
        color: "#fff",
    },
    scrollContent: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontFamily: FONTS.semiBold,
        color: "#374151",
        marginBottom: 12,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        paddingLeft: 6,
        paddingRight: 16,
        marginBottom: 16,
        backgroundColor: "#F9FAFB",
    },
    currencyBadge: {
        backgroundColor: "#E5E7EB",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 10,
    },
    currencyText: {
        fontSize: 13,
        fontFamily: FONTS.bold,
        color: "#4B5563",
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: FONTS.semiBold,
        color: "#111827",
    },
    balanceBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0F9FF",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    balanceText: {
        fontSize: 13,
        fontFamily: FONTS.medium,
        color: "#316b83",
        marginLeft: 8,
    },
    note: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        color: "#9CA3AF",
        marginBottom: 20,
        lineHeight: 18,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelButton: {
        backgroundColor: "#F3F4F6",
    },
    confirmButton: {
        backgroundColor: "#316b83",
        shadowColor: "#316b83",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    cancelText: {
        color: "#374151",
        fontFamily: FONTS.bold,
        fontSize: 15,
    },
    confirmText: {
        color: "#fff",
        fontFamily: FONTS.bold,
        fontSize: 15,
    },
});

export default Withdraw;
