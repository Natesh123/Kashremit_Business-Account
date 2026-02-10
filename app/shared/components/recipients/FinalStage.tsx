import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
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
                    console.error('Fetch dashboard details', err.response?.data?.message)
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
                    console.error('Fetch dashboard details', err.response?.data?.message)
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

    const renderRow = (label: string, value: any, valueStyle: any = {}) => (
        <View style={styles.row}>
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
            <View style={[styles.headerContainer, { backgroundColor: "#316b83", paddingVertical: 15, borderBottomWidth: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", fontFamily: "SF Pro Display" }}>Payment Method</Text>
            </View>

            {/* Content */}
            <Container style={{ backgroundColor: '#f9f9f9', flex: 1 }}>
                <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={{ marginBottom: 15 }}>
                        <Text style={styles.header}>Choose your transfer type</Text>
                        <Text style={[styles.header, { marginTop: 10 }]}>
                            Fast and Easy payment Mode
                        </Text>
                    </View>

                    {/* Debit Card Option */}
                    <View style={styles.transferTypeContainer}>
                        <TouchableOpacity
                            style={styles.cardOption}
                            onPress={() => setSelectedTransferType("debitCard")}
                        >
                            <View style={styles.cardLeft}>
                                <Text style={styles.cardIcon}>💳</Text>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.cardTitle}>Debit Card</Text>
                                    <Text style={styles.cardSubtitle}>Add new card (Visa or Mastercard)</Text>
                                </View>
                            </View>
                            <View style={styles.radioCircle}>
                                {selectedTransferType === "debitCard" && <View style={styles.selectedRb} />}
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Use Account Balance Option */}
                    <View style={{ marginTop: 15 }}>
                        <Text style={styles.header}>Account Balance :  {accountBalance} GBP</Text>
                        <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() => setSelectedTransferType("accountBalance")}
                        >
                            <View style={styles.radioCircle}>
                                {selectedTransferType === "accountBalance" && <View style={styles.selectedRb} />}
                            </View>
                            <Text style={styles.radioLabel}>Use Account Balance</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Promo Code */}
                    <View style={{ marginTop: 15 }}>
                        <Text style={styles.promocode}>Apply Promo Code</Text>

                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter promo code"
                                value={promoCode}
                                onChangeText={setPromoCode}
                            />

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={async () => {
                                    const sendAmount = await AsyncStorage.getItem("sendAmount");

                                    fetchGetPromocode({
                                        Amount: Number(sendAmount) || 0, // ensure it's a number
                                        PromocodeValue: promoCode,
                                    });
                                }}
                            >
                                <Text style={styles.applyText}>Apply</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ✅ Show applied message */}
                        {promoDiscount > 0 && (
                            <Text style={styles.appliedText}>
                                {promoCode.toUpperCase()} applied
                            </Text>
                        )}
                    </View>


                    {/* Transfer Details */}





                    {/* Recipient Details */}
                    <View style={{ marginTop: 15 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.detailsHeader}>Recipient Details</Text>
                            {/* <TouchableOpacity style={styles.editButtonTop} onPress={_onUpdateRecipientPressed}>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity> */}
                        </View>
                        <View style={styles.detailsBox}>
                            {recipientDetails.ChannelTransferType === "CGMONEY" ? (
                                <>
                                    {renderRow("Email", `${recipientDetails.userEmail}`)}
                                    {renderRow("Cash pickup point", `${recipientDetails.CashPickup}`)}
                                </>
                            ) : (
                                <>
                                    {renderRow("Recipient Receive Amount", transferDetails.sendAmount)}
                                    {renderRow("Account Name", `${recipientDetails.AccountName}`)}
                                    {renderRow("Account Number", `${recipientDetails.AccountNumber}`)}
                                    {renderRow("IFSC Code", `${recipientDetails.IFSCCode}`)}
                                    {renderRow("Mobile Number", `${recipientDetails.Mobile}`)}
                                    {renderRow("Email", `${recipientDetails.userEmail}`)}

                                </>
                            )}
                        </View>
                    </View>

                    {/* Transfer Details Section */}
                    <View style={{ marginTop: 15 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.detailsHeader}>Transfer Details</Text>
                            {/* <TouchableOpacity style={styles.editButtonTop} onPress={_onUpdatePressed}>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity> */}
                        </View>
                        <View style={styles.detailsBox}>
                            {renderRow("Actual Send", `${transferDetails.sendAmount} GBP`)}
                            {renderRow("Transfer Fee", `${transferDetails.transferFee} GBP`)}
                            {promoDiscount > 0
                                ? renderRow(
                                    "Discount",
                                    `-${promoDiscount} GBP`,
                                    { color: "red" }
                                )
                                : renderRow(
                                    "Discount",
                                    `${promoDiscount} GBP`,
                                    {}
                                )
                            }

                            {renderRow(
                                "Final amount",
                                `${Number(transferDetails.amountToBePaid) - promoDiscount} GBP`
                            )}


                            {/* {selectedTransferType === "accountBalance" &&
                            renderRow("Final amount", `${transferDetails.amountToBePaid} GBP`)} */}

                            {/* {selectedTransferType === "debitCard"
                            ? renderRow("Amount to be paid", `${transferDetails.amountToBePaid} GBP`)
                            : renderRow("Amount to be paid", `0 GBP`)} */}

                            {/* {renderRow("Amount We'll Convert", transferDetails.amountConvert)} */}
                        </View>
                    </View>


                </ScrollView>
            </Container>

            {/* Bottom Button */}
            <View style={styles.bottomButton}>
                <Button
                    style={styles.largeButton}
                    onPress={() => fetchInitTransaction(currentToken.tokenId, currentToken.remitterId)}
                >
                    Paynow
                </Button>
            </View>

            <ToastConfig
                visible={popupVisible}
                message={statusMessage}
                onClose={() => {
                    setPopupVisible(false);
                    // Navigate only after user clicks OK
                    navigation.navigate("Root" as never);
                }}
            />


        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f7f9" },
    transferTypeContainer: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 15,
        marginTop: 10,
        borderColor: "#ddd",
        borderWidth: 1,
    },
    editButton: {
        position: "absolute",
        top: -12,
        backgroundColor: "#316b83",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
        zIndex: 1,
    },
    editButtonTop: {
        backgroundColor: "#316b83",
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 6,
        marginTop: 15,   // ⬅ Moves the button a bit lower
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start", // allows independent vertical alignment
        marginBottom: 5,
    },



    editText: {
        color: "#fff",
        fontSize: 14,
        fontFamily: "SF Pro Display",
        fontWeight: "600",
    },
    detailsBox: {
        borderWidth: 1,
        borderColor: "#757875",
        borderRadius: 12,
        paddingHorizontal: 17,
        paddingTop: 20,   // extra padding to avoid overlap
        paddingBottom: 5,
        marginTop: 10,
        borderStyle: "dotted",
    },

    appliedText: {
        marginTop: 8,
        fontSize: 13,
        fontFamily: "SF Pro Display",
        fontWeight: "600",
        color: "green",
    },



    cardOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    cardLeft: { flexDirection: "row", alignItems: "center" },
    cardIcon: { fontSize: 22, fontFamily: "SF Pro Display" },
    cardTitle: { fontSize: 14, fontFamily: "SF Pro Display", fontWeight: "600", color: "#000" },
    cardSubtitle: { fontSize: 12, fontFamily: "SF Pro Display", color: "#666", marginTop: 2 },
    radioOption: { flexDirection: "row", alignItems: "center", marginTop: 10 },
    radioCircle: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#316b83",
        alignItems: "center",
        justifyContent: "center",
    },
    selectedRb: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#316b83" },
    radioLabel: { marginLeft: 10, fontSize: 14, fontFamily: "SF Pro Display", color: "#000" },
    applyButton: {
        backgroundColor: "#316b83",
        paddingHorizontal: 20,
        height: 50,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    applyText: { color: "#fff", fontSize: 14, fontFamily: "SF Pro Display", fontWeight: "600" },
    inputRow: { marginTop: 15, flexDirection: "row", alignItems: "center", gap: 8 },
    input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingHorizontal: 10, height: 50 },
    scrollContainer: { paddingHorizontal: 15, marginTop: 20, marginBottom: 80 },
    header: { fontSize: 14, fontFamily: "SF Pro Display", fontWeight: "600", color: "#000" },
    promocode: { marginTop: 10, fontSize: 14, fontFamily: "SF Pro Display", fontWeight: "600", color: "#000" },

    detailsHeader: { fontSize: 14, fontFamily: "SF Pro Display", fontWeight: "600", marginTop: 10, color: "#000" },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: "#E0E0E0",
        borderStyle: "dashed",
        gap: 5,
    },
    label: { fontSize: 12, fontFamily: "SF Pro Display", color: "#555", flex: 0.4, textAlign: "left" },
    value: { fontSize: 12, fontFamily: "SF Pro Display", fontWeight: "600", color: "#000", flex: 0.6, textAlign: "right", flexWrap: "wrap" },
    largeButton: { width: "100%", height: 55, paddingVertical: 8, borderRadius: 10 },
    bottomButton: { width: "100%", padding: 10, position: "absolute", bottom: 0, left: 0 },
});

export default FinalStage;
function setWithdrawAccountBalance(WD_BalanceAmount: any) {
    throw new Error("Function not implemented.");
}

function setAccountBalance(BalanceAmount: any) {
    throw new Error("Function not implemented.");
}


