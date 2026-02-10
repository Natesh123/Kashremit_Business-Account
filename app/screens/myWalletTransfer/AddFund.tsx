import HomeHeader from "app/components/HomeHeader";
import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from "react-native";
import { ProfileState } from "../../atoms";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const AddFund = () => {
    const [amount, setAmount] = useState("");
    const navigation = useNavigation();
    const [selectedPayment, setSelectedPayment] = useState(""); // "debit", "credit", "netbanking"
    const currentToken = useRecoilValue(ProfileState);
    const accountBalance = "0.00";
    const currency = "£";

    const handlePayNow = () => {
        console.log("Pay Now clicked", amount, selectedPayment);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* <HomeHeader name={currentToken.firstName} currency={currency} reward="" /> */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Funds</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* <Text style={styles.heading}>Add Funds</Text> */}

                {/* Amount Section */}
                <View style={styles.amountBox}>
                    <Text style={styles.label}>Enter the Amount</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currency}>GBP</Text>
                        <TextInput
                            placeholder="Enter the Amount"
                            style={styles.input}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>
                    <Text style={styles.balance}>
                        Available Withdraw Wallet Balance {currency} {accountBalance}
                    </Text>
                </View>

                {/* Cards Section */}
                <Text style={styles.sectionHeading}>Cards</Text>
                {["debit", "credit"].map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={styles.paymentOptionCard}
                        onPress={() => setSelectedPayment(type)}
                    >
                        <View
                            style={[
                                styles.radio,
                                selectedPayment === type && styles.radioSelected,
                            ]}
                        />
                        <View style={styles.paymentInfoCard}>
                            <Text style={styles.paymentText}>
                                {type === "debit" ? "Debit Card" : "Credit Card"}
                            </Text>
                            <Text style={styles.subText}>Add new card (Visa or Mastercard)</Text>
                        </View>
                        <View style={styles.cardLogos}>
                            <Image
                                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" }}
                                style={styles.logo}
                            />
                            <Image
                                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png" }}
                                style={styles.logo}
                            />
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Digital Wallets */}
                <Text style={styles.sectionHeading}>Digital Wallets</Text>
                <View style={styles.walletsWrapper}>
                    <View style={styles.walletRow}>
                        {/* First Row: 2 cards */}
                        <TouchableOpacity style={styles.walletButtonLarge}>
                            <Image source={require('../../assets/images/gpay.png')} style={styles.walletLogoLarge} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.walletButtonLarge}>
                            <Image source={require('../../assets/images/applepay.png')} style={styles.walletLogoLarge} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.walletRow, { justifyContent: "center" }]}>
                        {/* Second Row: 1 card */}
                        <TouchableOpacity style={styles.walletButtonLarge}>
                            <Image
                                source={require('../../assets/images/paypal.png')}
                                style={styles.walletLogoLarge}
                            />
                        </TouchableOpacity>
                    </View>

                </View>


                {/* Bank Transfers */}
                <Text style={styles.sectionHeading}>Bank Transfers</Text>
                <TouchableOpacity
                    style={styles.paymentOption}
                    onPress={() => setSelectedPayment("netbanking")}
                >
                    <View
                        style={[
                            styles.radio,
                            selectedPayment === "netbanking" && styles.radioSelected,
                        ]}
                    />
                    <Text style={styles.paymentText}>Net Banking</Text>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.cancelButton}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
                        <Text style={styles.payText}>Pay Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f7f9" },
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
        color: "#fff",
    },
    scrollContent: { paddingVertical: 20, paddingHorizontal: 20 },
    heading: { fontSize: 14, fontWeight: "600", marginBottom: 20, color: "#316b83" },
    amountBox: { backgroundColor: "#fff", padding: 15, borderRadius: 10, marginBottom: 20 },
    label: { fontSize: 14, marginBottom: 10, color: "#555" },
    inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10 },
    currency: { fontSize: 14, marginRight: 5 },
    input: { flex: 1, height: 40 },
    balance: { fontSize: 12, marginTop: 5, color: "#999" },
    sectionHeading: { fontSize: 14, fontWeight: "600", marginVertical: 10 },
    paymentOption: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "#ccc", marginRight: 10 },
    radioSelected: { backgroundColor: "#316b83", borderColor: "#316b83" },
    paymentInfo: { flex: 1 },
    paymentText: { fontSize: 12, fontWeight: "500" },
    subText: { fontSize: 12, color: "#888" },
    cardLogos: { flexDirection: "row", alignItems: "center" },
    logo: { width: 30, height: 20, resizeMode: "contain", marginLeft: 5 },
    walletsContainer: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
    walletButton: { flex: 1, backgroundColor: "#fff", padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: "center" },
    walletLogo: { width: 60, height: 20, resizeMode: "contain" },
    actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
    cancelButton: { flex: 1, backgroundColor: "#fff", padding: 15, borderRadius: 10, marginRight: 10, alignItems: "center" },
    cancelText: { color: "#316b83", fontWeight: "600" },
    payButton: { flex: 1, backgroundColor: "#316b83", padding: 15, borderRadius: 10, alignItems: "center" },
    payText: { color: "#fff", fontWeight: "600" },
    paymentOptionCard: { flexDirection: "row", alignItems: "center", padding: 15, backgroundColor: "#fff", borderRadius: 10, marginVertical: 5 },
    paymentInfoCard: { flex: 1, marginLeft: 10 },
    walletsWrapper: { marginVertical: 10 },
    walletRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    walletButtonLarge: {
        flex: 1,
        backgroundColor: "#fff",
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: "center",
        justifyContent: "center",
    },

    walletLogoLarge: { width: 140, height: 60, resizeMode: "contain" },


});

export default AddFund;
