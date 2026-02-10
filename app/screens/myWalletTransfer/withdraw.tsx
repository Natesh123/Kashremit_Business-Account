import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
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
        <SafeAreaView style={style.container}>
            {/* <HomeHeader name={currentToken.firstName} currency={currency} reward="" /> */}
            <View style={style.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={style.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={style.headerTitle}>Withdraw from my wallet</Text>
            </View>
            <Container>
                <ScrollView contentContainerStyle={style.scrollContent}>
                    <View style={style.card}>
                        {/* <Text style={style.title}>Withdraw from my wallet</Text> */}

                        <Text style={style.label}>Enter the Amount to withdraw</Text>

                        <View style={style.inputWrapper}>
                            <Text style={style.currency}>GBP</Text>
                            <TextInput
                                style={style.input}
                                placeholder="Enter the Amount"
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

                        <Text style={style.balance}>
                            Available Withdraw Wallet Balance £ {availableBalance}
                        </Text>

                        <Text style={style.note}>
                            * User can withdraw money only paid for the transactions.
                        </Text>

                        {loading && <ActivityIndicator size="large" color="#316b83" style={{ marginVertical: 10 }} />}

                        <View style={style.buttonRow}>
                            <TouchableOpacity style={[style.button, style.cancelButton]} onPress={() => navigation.goBack()}>
                                <Text style={style.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[style.button, style.confirmButton]} onPress={handleConfirm} disabled={isConfirmDisabled}>
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


        </SafeAreaView>
    );
};

const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7f9",
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        // marginTop: "8%",
        paddingVertical: 15,
        backgroundColor: "#316b83",
    },
    backButton: {
        padding: 4,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: FONTS.semibold,
        color: "#fff",
    },
    scrollContent: {
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        elevation: 3,
    },
    title: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: "#555",
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    currency: {
        fontSize: 14,
        color: "#555",
        marginRight: 4,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 14,
    },
    balance: {
        fontSize: 12,
        color: "#555",
        marginBottom: 10,
    },
    note: {
        fontSize: 12,
        color: "#999",
        marginTop: 4,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 25,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginLeft: 10,
    },
    cancelButton: {
        backgroundColor: "#e0e0e0",
    },
    confirmButton: {
        backgroundColor: "#316b83",
    },
    cancelText: {
        color: "#333",
        fontWeight: "500",
    },
    confirmText: {
        color: "#fff",
        fontWeight: "500",
    },
});

export default Withdraw;
