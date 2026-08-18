import { FONTS } from "../../constants/Assets";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRecoilValue } from "recoil";

import Button from "app/components/controls/Button";
import ToastConfig from "app/components/ToastConfig";
import { ProfileState } from "app/atoms";
import { InitTransactions, GetWalletBalance } from "app/http-services";
import ModalHeaderBack from "app/components/ModalHeaderBack";
import Container from "app/theme/Container";
import { LinearGradient } from "expo-linear-gradient";

type SelectedPackageType = {
  name?: string;
  price?: number;   // Price in GBP
  amount?: number;  // Airtime value in INR
  description?: string;
  validity?: string;
  displayvalue?: string;
  product_id?: number;
  operator_id?: number;
};

type RecipientDetailsType = {
  displayvalue: string;
  operator_id: any;
  userEmail: string;
  AccountName: string;
  AccountNumber: string;
  IFSCCode: string;
  CashPickup: string;
  ChannelTransferType: string;
  selectedPackage?: SelectedPackageType;
  CountryCode?: string;
};



const AirtimeTopupPay = () => {
  const navigation = useNavigation();
  const currentToken = useRecoilValue(ProfileState);

  const [loading, setLoading] = useState(false);
  const [accountBalance, setAccountBalance] = useState("0");
  const [popupVisible, setPopupVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [recipientDetails, setRecipientDetails] = useState<RecipientDetailsType>({
    userEmail: "",
    AccountName: "0",
    AccountNumber: "0",
    IFSCCode: "0",
    CashPickup: "0",
    ChannelTransferType: "Banks",
  });

  const [selectedTransferType, setSelectedTransferType] =
    useState<"accountBalance" | "debitCard">("accountBalance");

  useEffect(() => {
    fetchStoredRecipientData();
    fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
  }, []);

  const fetchStoredRecipientData = async () => {
    try {
      const storedRecipient = await AsyncStorage.getItem("selectedRecipient");
      if (storedRecipient) {
        const data: RecipientDetailsType = JSON.parse(storedRecipient);
        setRecipientDetails(data);
      }
    } catch (err) {
      console.error("Error fetching recipient:", err);
    }
  };

  const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const res: any = await GetWalletBalance({});
      if (res.status === 200) {
        setAccountBalance(res?.data?.BalanceAmount?.toString() ?? "0");
      }
    } catch (err) {
      console.error("Error fetching wallet balance:", err);
    } finally {
      setLoading(false);
    }
  };

  // const handlePayNow = async () => {
  //   try {
  //     setLoading(true);


  //     const storedRecipient = await AsyncStorage.getItem("selectedRecipient");
  //     const storedOperator = await AsyncStorage.getItem("selectedOperator");

  //     if (!storedRecipient || !storedOperator) {
  //       Alert.alert("Error", "Please select recipient and operator.");
  //       return;
  //     }

  //     const recipient: RecipientDetailsType = JSON.parse(storedRecipient);
  //     const operator: RecipientDetailsType = JSON.parse(storedOperator);

  //     if (!recipient.selectedPackage) {
  //       Alert.alert("Error", "Please select a top-up package.");
  //       return;
  //     }

  //     const pkg = recipient.selectedPackage;
  //     const airtimeValue = pkg.displayvalue
  //   ? parseInt(pkg.displayvalue.replace(/\D/g, ""), 10)
  //   : 0;
  //   const priceValue = pkg.price
  //   ? parseFloat(pkg.price.toString().replace(/[^\d.]/g, ""))
  //   : 0;

  //     // Prepare request payload
  //     const requestPayload = {
  //       operator_id: recipient.operator_id,
  //       operator_name: "Service One",
  //       product_id: pkg.product_id?.toString() ?? 8141,
  //       product_name: pkg.displayvalue ?? operator.displayvalue ?? "",
  //       price: priceValue,                  // amount you pay (source)
  //       displayvalue: airtimeValue,    // airtime to receive (destination)
  //       unit: "INR",
  //       toCountry: recipient.CountryCode ?? "IND",
  //       Mobile: recipient.AccountNumber ?? recipient.userEmail,
  //     };

  //     console.log("Request Payload:", requestPayload);

  //     const response = await InitTransactions(requestPayload);
  //     console.log(response);

  //     if (response?.status === 200) {
  //     //   setStatusMessage("Transaction initialized successfully!");
  //       setPopupVisible(true);
  //     } else {
  //       Alert.alert("Error", response?.data?.message || "Failed to initialize transaction");
  //     }
  //   } catch (err) {
  //     console.error("InitTransaction error:", err);
  //     Alert.alert("Error", "Something went wrong while processing your payment.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePayNow = async () => {
    try {
      setLoading(true);

      // Retrieve stored data
      const storedRecipient = await AsyncStorage.getItem("selectedRecipient");
      const storedOperator = await AsyncStorage.getItem("selectedOperator");

      if (!storedRecipient || !storedOperator) {
        Alert.alert("Error", "Please select recipient and operator.");
        return;
      }

      const recipient: RecipientDetailsType = JSON.parse(storedRecipient);
      const operator: RecipientDetailsType = JSON.parse(storedOperator);

      // Validate top-up package
      if (!recipient.selectedPackage) {
        Alert.alert("Error", "Please select a top-up package.");
        return;
      }

      const pkg = recipient.selectedPackage;

      // Extract numeric values safely
      const airtimeValue = pkg.displayvalue
        ? parseInt(pkg.displayvalue.replace(/\D/g, ""), 10)
        : 0;

      const priceValue = pkg.price
        ? parseFloat(pkg.price.toString().replace(/[^\d.]/g, ""))
        : 0;

      // Prepare request payload for InitTransactions API
      const requestPayload = {
        operator_id: recipient.operator_id,
        operator_name: "Service One",
        product_id: pkg.product_id?.toString() ?? "8141",
        product_name: pkg.displayvalue ?? operator.displayvalue ?? "",
        price: priceValue,                // Source amount (e.g., GBP)
        displayvalue: airtimeValue,       // Destination amount (e.g., INR)
        unit: "INR",
        toCountry: recipient.CountryCode ?? "IND",
        Mobile: recipient.AccountNumber ?? recipient.userEmail,
      };

      console.log("Request Payload:", requestPayload);

      // Call InitTransactions API
      const response = await InitTransactions(requestPayload);
      console.log("InitTransaction Response:", response);

      // Handle API response based on StatusCode
      // Handle API response based on StatusCode
      const statusCode = response?.data?.StatusCode;
      const statusMsg = response?.data?.StatusMsg || "Failed to initialize transaction";

      if (statusCode === "ER0000") {
        setStatusMessage("Transaction initialized successfully!");
        setPopupVisible(true);
      } else {
        console.log("Final Alert Message:", statusMsg);
        setStatusMessage(statusMsg);
        setPopupVisible(true);
      }


    } catch (err) {
      console.error("InitTransaction error:", err);
      Alert.alert("Error", "Something went wrong while processing your payment.");
    } finally {
      setLoading(false);
    }
  };


  const renderRow = (label: string, value: string, isLast?: boolean) => (
    <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7f9' }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#316b83' }}>
        <ModalHeaderBack title="Payment Method" />
      </SafeAreaView>

      <Container style={{ backgroundColor: '#f5f7f9', flex: 1 }}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Final Amount Header */}
          <View style={{ alignItems: 'center', marginVertical: 28 }}>
            <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '500', marginBottom: 4 }}>Total to Pay</Text>
            <Text style={{ fontSize: 34, fontWeight: '700', color: '#111827' }}>
              £{recipientDetails.selectedPackage?.price ?? 0}
            </Text>
          </View>

          <View style={[styles.sectionHeader, { marginTop: 0 }]}>
            <Text style={styles.detailsHeader}>Payment Method</Text>
          </View>

          {/* Wallet Option */}
          <TouchableOpacity
            style={[styles.transferTypeContainer, { marginTop: 0, borderColor: selectedTransferType === "accountBalance" ? "#316b83" : "#E5E7EB", borderWidth: selectedTransferType === "accountBalance" ? 2 : 1, backgroundColor: selectedTransferType === "accountBalance" ? '#F8FAFC' : '#fff' }]}
            onPress={() => setSelectedTransferType("accountBalance")}
            activeOpacity={0.8}
          >
            <View style={styles.cardOption}>
              <View style={styles.cardLeft}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: selectedTransferType === "accountBalance" ? '#fff' : '#F0F9FF', alignItems: 'center', justifyContent: 'center' }}>
                   <Ionicons name="wallet" size={24} color="#316b83" />
                </View>
                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.cardTitle}>Wallet Balance</Text>
                  <Text style={[styles.cardSubtitle, { color: '#059669', fontWeight: '600' }]}>Available: {accountBalance} GBP</Text>
                </View>
              </View>
              <View style={[styles.radioCircle, selectedTransferType === "accountBalance" && { backgroundColor: '#316b83', borderColor: '#316b83' }]}>
                {selectedTransferType === "accountBalance" && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
            </View>
          </TouchableOpacity>

          {/* Debit Card Option */}
          <TouchableOpacity
            style={[styles.transferTypeContainer, { borderColor: selectedTransferType === "debitCard" ? "#316b83" : "#E5E7EB", borderWidth: selectedTransferType === "debitCard" ? 2 : 1, backgroundColor: selectedTransferType === "debitCard" ? '#F8FAFC' : '#fff' }]}
            onPress={() => setSelectedTransferType("debitCard")}
            activeOpacity={0.8}
          >
            <View style={styles.cardOption}>
              <View style={styles.cardLeft}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: selectedTransferType === "debitCard" ? '#fff' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                   <Ionicons name="card" size={24} color="#4B5563" />
                </View>
                <View style={{ marginLeft: 14 }}>
                  <Text style={styles.cardTitle}>Debit Card</Text>
                  <Text style={styles.cardSubtitle}>Add new card (Visa or Mastercard)</Text>
                </View>
              </View>
              <View style={[styles.radioCircle, selectedTransferType === "debitCard" && { backgroundColor: '#316b83', borderColor: '#316b83' }]}>
                {selectedTransferType === "debitCard" && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
            </View>
          </TouchableOpacity>

          {/* Topup Details */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.detailsHeader}>Topup Details</Text>
            </View>
            <View style={styles.detailsBox}>
              {renderRow("Destination Country", recipientDetails.CountryCode ?? "IND")}
              {renderRow(
                "Airtime to receive",
                recipientDetails.selectedPackage?.displayvalue
                  ?.toString()
                  .match(/\d+/)?.[0] ?? "0"
              )}

              {renderRow("Plan Name", recipientDetails.selectedPackage?.displayvalue ?? "N/A")}
              {renderRow("Plan validity", recipientDetails.selectedPackage?.validity ?? "-1 DAY")}
              {renderRow("Plan benefits", recipientDetails.selectedPackage?.description ?? "N/A", true)}
            </View>
          </View>

          {/* Transfer Details */}
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.detailsHeader}>Transfer Details</Text>
            </View>
            <View style={styles.detailsBox}>
              {renderRow(
                "Top-up amount",
                `${recipientDetails.selectedPackage?.price ?? 0}`
              )}
              {renderRow("Transfer Fee", `0 GBP`)}
              {renderRow("Discount", `0 GBP`)}
              {renderRow(
                "Final amount",
                `${recipientDetails.selectedPackage?.price ?? 0}`,
                true
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: 16, paddingBottom: 30, backgroundColor: 'transparent' }}>
          <TouchableOpacity
            onPress={handlePayNow}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#104e5b", "#316b83"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 28,
                height: 56,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#104e5b",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {loading ? "Processing..." : "Pay Now"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ToastConfig
          visible={popupVisible}
          message={statusMessage}
          onClose={() => {
            setPopupVisible(false);
            navigation.reset({
              index: 0,
              routes: [{ name: "Root" }],
            });
          }}
        />

      </Container>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f9" },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: { padding: 4, marginRight: 10 },
  headerTitle: { fontSize: 14, fontWeight: "600", color: "#000", fontFamily: FONTS.regular },
  scrollContainer: { paddingHorizontal: 16, marginTop: 20 },
  header: { fontSize: 14, fontWeight: "700", color: "#1F2937", marginBottom: 6 },
  transferTypeContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flexDirection: "row", alignItems: "center" },
  cardIcon: { fontSize: 24 },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  cardSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  radioOption: { flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 6 },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedRb: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#316b83" },
  radioLabel: { marginLeft: 12, fontSize: 14, color: "#1F2937", fontWeight: "600" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  detailsHeader: { fontSize: 15, fontWeight: "700", color: "#316b83", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  detailsBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 5,
  },
  label: { fontSize: 14, color: "#4B5563", flex: 0.5, textAlign: "left", fontWeight: "600" },
  value: { fontSize: 14, fontWeight: "700", color: "#1F2937", flex: 0.5, textAlign: "right", flexWrap: "wrap" },
});

export default AirtimeTopupPay;
