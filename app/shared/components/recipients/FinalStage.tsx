import { FONTS } from "../../../constants/Assets";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Container from "app/theme/Container";
import Button from "app/components/controls/Button";
import CircularProgress from "app/components/CircularProgress";
import { GetCardDetails, GetGDPR, GetPromoCode, GetPurposeOfTransaction, GetWalletBalance, InitTransaction, ValidateSendMoney } from "app/http-services";
import { useRecoilValue } from "recoil";
import Toast from 'react-native-toast-message';
import { ProfileState } from "app/atoms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ToastConfig from "app/components/ToastConfig";
import { useSetRecoilState } from "recoil";
import { ProfileTabState } from "app/atoms";


const FinalStage = () => {
    const navigation = useNavigation();
    const currentToken = useRecoilValue(ProfileState);
    const [loading, setLoading] = useState(false);
    const [purposeList, setPurposeList] = useState<any[]>([]);
    const [selectedPurpose, setSelectedPurpose] = useState("");
    const [accountBalance, setAccountBalance] = useState("0");
    const [checkedTermsRemitSMS, setCheckedTermsRemitSMS] = useState('N');
    const [checkedTermsRemitEMAIL, setCheckedTermsRemitEMAIL] = useState('N');
    const [checkedTermsInsureSMS, setCheckedTermsInsureSMS] = useState('N');
    const [checkedTermsInsureEMAIL, setCheckedTermsInsureEMAIL] = useState('N');
    const [popupVisible, setPopupVisible] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [promoCode, setPromoCode] = useState<string>("");
    const setProfileTab = useSetRecoilState(ProfileTabState);
    const [amount, setAmount] = useState<number>(500);
    const [promoDiscount, setPromoDiscount] = useState<number>(0);


    // ✅ State for AsyncStorage values
    const [transferDetails, setTransferDetails] = useState({
        sendAmount: "0",
        transferFee: "0",
        transferFeeDiscount: "0",
        amountToBePaid: "0",
        conversionRate: "0",
        DebitfromAccountBalance: "0",
        amountConvert: "0",
    });

    const [recipientDetails, setRecipientDetails] = useState({
        userEmail: "",
        Mobile: "",
        AccountName: "0",
        AccountNumber: "0",
        IFSCCode: "0",
        CashPickup: "0",
        ChannelTransferType: "Banks",
    });

    // ✅ Single state for radio buttons
    const [selectedTransferType, setSelectedTransferType] = useState<"accountBalance" | "debitCard">("accountBalance");

    useEffect(() => {
        fetchPurposeOfTransaction(currentToken.tokenId, currentToken.remitterId);
        fetchStoredTransferData();
        fetchStoredRecipientData();
        fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
        fetchCardDetails(currentToken.tokenId, currentToken.remitterId);
        fetchGDPR(currentToken.tokenId, currentToken.remitterId);
        fetchValidateSendMoney(currentToken.tokenId, currentToken.remitterId);
    }, []);


    const fetchValidateSendMoney = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = await ValidateSendMoney();
            if (response.status === 200 && response.data) {
                const data = response.data?.data || response.data;

            }
        } catch (err) {
            console.error("Error fetching send money:", err);
        } finally {
            setLoading(false);
        }
    };



    const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetWalletBalance({});
            console.log("Response :", response)
            response.then((res: any) => {
                if (res.status === 200) {
                    setAccountBalance(res?.data?.BalanceAmount?.toString() ?? "0");
                }
            })
                .catch((err) => {
                    console.warn('Fetch wallet balance failed:', err.response?.data?.message || err.message || err);
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error fetching dashboard details:', error);
        }
    };


    const fetchGDPR = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetGDPR(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    setCheckedTermsRemitSMS(res?.data?.Option1)
                    setCheckedTermsRemitEMAIL(res?.data?.Consent)
                    setCheckedTermsInsureSMS(res?.data?.Option2)
                    setCheckedTermsInsureEMAIL(res?.data?.Option3)
                }
            })
                .catch((err) => {
                    console.error('Fetch Remitter profile', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error Remitter profile:', error);
        }
    };

    //     const fetchInitTransaction = async (tokenId: string, remitterId: string) => {
    //   try {
    //     setLoading(true);

    //     // Await the API call
    //     const res: any = await InitTransaction();
    //     console.log("Response :", res);

    //     const statusCode = res?.data?.StatusCode;
    //     const statusMsg = res?.data?.StatusMsg;

    //     if (statusMsg) {
    //       setStatusMessage(statusMsg);
    //       setPopupVisible(true);
    //     }



    //   } catch (error: any) {
    //     console.error('Fetch dashboard details', error.response?.data?.message || error.message);
    //   } finally {
    //     setLoading(false);
    //   }
    // };


    const fetchInitTransaction = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);

            const res: any = await InitTransaction();
            console.log("Response :", res);

            const statusCode = res?.data?.StatusCode;
            const statusMsg = res?.data?.StatusMsg;

            if (statusMsg) {
                setStatusMessage(statusMsg);
                setPopupVisible(true);
            }

            if (statusCode === "ER00115") {
                setTimeout(() => {
                    setPopupVisible(false);
                    setProfileTab(1);
                    navigation.navigate("Profile" as never);
                }, 2000);
            }

        } catch (error: any) {
            console.error('Fetch Init Transaction Error:', error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
        }
    };






    const fetchGetPromocode = async (req: { Amount: number; PromocodeValue: string }) => {
        try {
            setLoading(true);
            const res: any = await GetPromoCode(req);

            if (res?.data?.StatusCode === "ER0000" && res.data.promocode?.Offer_Applicable === "Y") {
                const discount = res.data.promocode.Offer_Amount ?? 0;

                setPromoDiscount(discount);
                setPromoCode(req.PromocodeValue);
                setStatusMessage(res.data.StatusMsg);
                Toast.show({
                    type: "success",
                    text1: "Promo Code",
                    text2: res.data.StatusMsg,
                });
            } else if (res?.data?.StatusCode === "ER0001") {
                setStatusMessage("Promo code not applicable");
                Toast.show({
                    type: "error",
                    text1: "Promo Code",
                    text2: res.data.StatusMsg,
                });

            }
        } catch (error: any) {
            console.error(
                "Fetch GetPromoCode error:",
                error.response?.data?.message || error.message
            );
            setStatusMessage("Promo code failed");
            // setPopupVisible(true);
        } finally {
            setLoading(false);
        }
    };


    const fetchCardDetails = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetCardDetails(tokenId);
            console.log("Response :", response)
            response.then((res: any) => {
                if (res.status === 200) {

                }
            })
                .catch((err) => {
                    console.warn('Fetch card details failed:', err.response?.data?.message || err.message || err);
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error fetching dashboard details:', error);
        }
    };

    // ✅ Fetch stored values from AsyncStorage
    const fetchStoredTransferData = async () => {
        try {
            const sendAmount = await AsyncStorage.getItem("sendAmount");
            const transferFee = await AsyncStorage.getItem("Transfer Fee");
            const amountToBePaid = await AsyncStorage.getItem("Amount to be paid");
            const amountConvert = await AsyncStorage.getItem("Amount we'll convert");
            const ConversionRate = await AsyncStorage.getItem("ConversionRate");
            setTransferDetails({
                sendAmount: sendAmount ?? "0",
                transferFee: transferFee ?? "0",
                transferFeeDiscount: "0",
                amountToBePaid: amountToBePaid ?? "0",
                conversionRate: ConversionRate ?? "0",
                DebitfromAccountBalance: amountToBePaid ?? "0",
                amountConvert: amountConvert ?? "0",
            });
        } catch (err) {
            console.error("Error fetching transfer data:", err);
        }
    };

    const fetchStoredRecipientData = async () => {
        try {
            const AccountName = await AsyncStorage.getItem("Account Name");
            const AccountNumber = await AsyncStorage.getItem("Account Number");
            const IFSCCode = await AsyncStorage.getItem("IFSC Code");
            const userEmail = await AsyncStorage.getItem("userEmail");
            const Mobile = await AsyncStorage.getItem("Mobile");
            const CashPickup = await AsyncStorage.getItem("Cash Pickup");
            const ChannelTransferType = await AsyncStorage.getItem("ChannelTransferType");

            setRecipientDetails({
                AccountName: AccountName ?? "0",
                AccountNumber: AccountNumber ?? "0",
                IFSCCode: IFSCCode ?? "0",
                userEmail: userEmail ?? "0",
                Mobile: Mobile ?? "",
                CashPickup: CashPickup ?? "0",
                ChannelTransferType: ChannelTransferType ?? "Banks",
            });
        } catch (err) {
            console.error("Error fetching recipient data:", err);
        }
    };

    // ✅ Fetch dropdown list
    const fetchPurposeOfTransaction = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = await GetPurposeOfTransaction(tokenId);
            console.log("Response :", response);

            if (response.status === 200 && response.data.POT) {
                const formattedList = response.data.POT
                    .filter((item: any) => item.Value_AnnualIncome !== "0")
                    .map((item: any) => ({
                        dataValue: item.Value_POT,
                        displayvalue: item.Text_POT,
                    }));

                setPurposeList(formattedList);
            }
        } catch (err) {
            console.error("Error fetching Purposeoftransaction list:", err);
        } finally {
            setLoading(false);
        }
    };

    const renderRow = (label: string, value: any, isLast: boolean = false, valueStyle: any = {}) => (
        <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>{label}</Text>
            <Text
                style={[styles.value, valueStyle]}
                numberOfLines={2}
                ellipsizeMode="tail"
            >
                {value}
            </Text>
        </View>
    );

    const _onUpdatePressed = async () => {
        navigation.navigate("SendMoney" as never);
    }

    const _onUpdateRecipientPressed = async () => {
        navigation.navigate("Recipient" as never);
    }

    return (
        <SafeAreaView style={[styles.container, { flex: 1, backgroundColor: '#316b83', marginTop: 0 }]}>
            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", fontFamily: FONTS.regular }}>Payment Method</Text>
            </View>

            {/* Content */}
            <Container style={{ backgroundColor: '#F2F2F7', flex: 1 }}>
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    
                    {/* Removed inner section heading as requested */}


                    {/* Debit Card Option */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.cardContainer, selectedTransferType === "debitCard" && styles.cardContainerSelected]}
                        onPress={() => setSelectedTransferType("debitCard")}
                    >
                        <View style={styles.cardLeft}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="card-outline" size={24} color="#316b83" />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.cardTitle}>Debit Card</Text>
                                <Text style={styles.cardSubtitle}>Add new card (Visa, MC)</Text>
                            </View>
                        </View>
                        <View style={styles.radioCircle}>
                            {selectedTransferType === "debitCard" && <View style={styles.selectedRb} />}
                        </View>
                    </TouchableOpacity>

                    {/* Use Account Balance Option */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.cardContainer, selectedTransferType === "accountBalance" && styles.cardContainerSelected, { marginTop: 12 }]}
                        onPress={() => setSelectedTransferType("accountBalance")}
                    >
                        <View style={styles.cardLeft}>
                             <View style={[styles.iconContainer, { backgroundColor: '#e8f0f2' }]}>
                                <Ionicons name="wallet-outline" size={24} color="#316b83" />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.cardTitle}>Wallet Balance</Text>
                                <Text style={styles.cardSubtitle}>Available: {accountBalance} GBP</Text>
                            </View>
                        </View>
                        <View style={styles.radioCircle}>
                            {selectedTransferType === "accountBalance" && <View style={styles.selectedRb} />}
                        </View>
                    </TouchableOpacity>

                    {/* Promo Code */}
                    <View style={styles.promoSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="gift-outline" size={20} color="#316b83" />
                            <Text style={[styles.sectionTitleSmall, { color: '#316b83' }]}>Promo Code</Text>
                        </View>
                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="pricetag-outline" size={20} color="#888" style={{marginLeft: 12}} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter promo code"
                                    placeholderTextColor="#999"
                                    value={promoCode}
                                    onChangeText={setPromoCode}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={async () => {
                                    const sendAmount = await AsyncStorage.getItem("sendAmount");
                                    fetchGetPromocode({
                                        Amount: Number(sendAmount) || 0,
                                        PromocodeValue: promoCode,
                                    });
                                }}
                            >
                                <Text style={styles.applyText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                        {promoDiscount > 0 && (
                            <Text style={styles.appliedText}>
                                <Ionicons name="checkmark-circle" size={14} color="green" /> {promoCode.toUpperCase()} applied successfully
                            </Text>
                        )}
                    </View>

                    {/* Recipient Details */}
                    <View style={styles.detailsSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="person-outline" size={20} color="#316b83" />
                            <Text style={[styles.sectionTitleSmall, { color: '#316b83' }]}>Recipient Details</Text>
                        </View>
                        <View style={styles.detailsBox}>
                            {recipientDetails.ChannelTransferType === "CGMONEY" ? (
                                <>
                                    {renderRow("Email", `${recipientDetails.userEmail}`)}
                                    {renderRow("Cash pickup point", `${recipientDetails.CashPickup}`, true)}
                                </>
                            ) : (
                                <>
                                    {renderRow("Receive Amount", `${transferDetails.sendAmount} GBP`)}
                                    {renderRow("Account Name", `${recipientDetails.AccountName}`)}
                                    {renderRow("Account Number", `${recipientDetails.AccountNumber}`)}
                                    {renderRow("IFSC Code", `${recipientDetails.IFSCCode}`)}
                                    {renderRow("Mobile", `${recipientDetails.Mobile}`)}
                                    {renderRow("Email", `${recipientDetails.userEmail}`, true)}
                                </>
                            )}
                        </View>
                    </View>

                    {/* Transfer Details Section */}
                    <View style={styles.detailsSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Ionicons name="document-text-outline" size={20} color="#316b83" />
                            <Text style={[styles.sectionTitleSmall, { color: '#316b83' }]}>Transfer Details</Text>
                        </View>
                        <View style={styles.detailsBox}>
                            {renderRow("Amount Sent", `${transferDetails.sendAmount} GBP`)}
                            {renderRow("Transfer Fee", `${transferDetails.transferFee} GBP`)}
                            {promoDiscount > 0
                                ? renderRow("Discount", `-${promoDiscount} GBP`, false, { color: "#D32F2F", fontWeight: '600' })
                                : renderRow("Discount", `${promoDiscount} GBP`)
                            }
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total to Pay</Text>
                                <Text style={styles.totalValue}>{`${Number(transferDetails.amountToBePaid) - promoDiscount} GBP`}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{height: 40}} />
                </ScrollView>

                {/* Bottom Button */}
                <View style={styles.bottomContainer}>
                    <Button
                        style={styles.largeButton}
                        onPress={() => fetchInitTransaction(currentToken.tokenId, currentToken.remitterId)}
                    >
                        Pay Now
                    </Button>
                </View>
            </Container>

            <ToastConfig
                visible={popupVisible}
                message={statusMessage}
                onClose={() => {
                    setPopupVisible(false);
                    navigation.navigate("Root" as never);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F2F2F7" },
    headerContainer: {
        backgroundColor: "#316b83",
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    scrollContainer: { paddingHorizontal: 16, marginTop: 10 },
    sectionHeading: { marginTop: 10, marginBottom: 20 },
    sectionTitle: { fontSize: 22, fontFamily: FONTS.regular, color: "#1C1C1E", fontWeight: "700" },
    sectionSubtitle: { fontSize: 14, fontFamily: FONTS.regular, color: "#8E8E93", marginTop: 4 },
    sectionTitleSmall: { fontSize: 16, fontFamily: FONTS.regular, fontWeight: "600", marginLeft: 8 },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    
    cardContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "transparent",
    },
    cardContainerSelected: {
        borderColor: "#316b83",
        backgroundColor: "#F7FAFC",
    },
    cardLeft: { flexDirection: "row", alignItems: "center" },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: "#F2F2F7", justifyContent: "center", alignItems: "center"
    },
    cardTitle: { fontSize: 15, fontFamily: FONTS.regular, fontWeight: "600", color: "#1C1C1E" },
    cardSubtitle: { fontSize: 13, fontFamily: FONTS.regular, color: "#8E8E93", marginTop: 2 },
    
    radioCircle: {
        height: 22,
        width: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#316b83",
        alignItems: "center",
        justifyContent: "center",
    },
    selectedRb: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#316b83" },
    
    promoSection: { marginTop: 24 },
    inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        height: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    input: { flex: 1, height: 50, paddingHorizontal: 12, fontSize: 15, fontFamily: FONTS.regular, color: "#1C1C1E" },
    applyButton: {
        backgroundColor: "#316b83",
        paddingHorizontal: 20,
        height: 50,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    applyText: { color: "#fff", fontSize: 15, fontFamily: FONTS.regular, fontWeight: "600" },
    appliedText: { marginTop: 8, fontSize: 13, fontFamily: FONTS.regular, color: "green", fontWeight: "500" },
    
    detailsSection: { marginTop: 24 },
    detailsBox: {
        backgroundColor: "#fff",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F2F2F7",
    },
    label: { fontSize: 14, fontFamily: FONTS.regular, color: "#8E8E93", flex: 0.5 },
    value: { fontSize: 14, fontFamily: FONTS.regular, fontWeight: "500", color: "#1C1C1E", flex: 0.5, textAlign: "right" },
    
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        marginTop: 4,
    },
    totalLabel: { fontSize: 16, fontFamily: FONTS.regular, color: "#1C1C1E", fontWeight: "700" },
    totalValue: { fontSize: 18, fontFamily: FONTS.regular, color: "#316b83", fontWeight: "700" },
    
    bottomContainer: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
    },
    largeButton: { width: "100%", height: 55, borderRadius: 12 },
});

export default FinalStage;
function setWithdrawAccountBalance(WD_BalanceAmount: any) {
    throw new Error("Function not implemented.");
}

function setAccountBalance(BalanceAmount: any) {
    throw new Error("Function not implemented.");
}


