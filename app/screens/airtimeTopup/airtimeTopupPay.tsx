import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
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


  const renderRow = (label: string, value: string) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { flex: 1, backgroundColor: '#316b83' }]}>
      {/* Header */}
      <ModalHeaderBack title="Payment Method" />

      <Container style={{ backgroundColor: '#f5f7f9', flex: 1 }}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>
            Final Amount: {recipientDetails.selectedPackage?.price ?? 0}
          </Text>
          <View style={{ marginTop: 15 }}>
            <Text style={styles.header}>Account Balance: {accountBalance} GBP</Text>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedTransferType("accountBalance")}
            >
              <View style={styles.radioCircle}>
                {selectedTransferType === "accountBalance" && <View style={styles.selectedRb} />}
              </View>
              <Text style={styles.radioLabel}>Use Wallet Balance</Text>
            </TouchableOpacity>
          </View>

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

          {/* Topup Details */}
          <View style={{ marginTop: 15 }}>
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
              {renderRow("Plan benefits", recipientDetails.selectedPackage?.description ?? "N/A")}
            </View>
          </View>

          {/* Transfer Details */}
          <View style={{ marginTop: 15 }}>
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
                `${recipientDetails.selectedPackage?.price ?? 0}`
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomButton}>
          <Button
            style={styles.largeButton}
            onPress={handlePayNow}
            disabled={loading}
          >
            {loading ? "Processing..." : "Pay Now"}
          </Button>
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
    </SafeAreaView>
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
  headerTitle: { fontSize: 14, fontWeight: "600", color: "#000", fontFamily: "FONTS.regular" },
  scrollContainer: { paddingHorizontal: 15, marginTop: 20, marginBottom: 80 },
  header: { fontSize: 12, fontWeight: "600", color: "#000", fontFamily: "FONTS.regular" },
  transferTypeContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  cardOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flexDirection: "row", alignItems: "center" },
  cardIcon: { fontSize: 22, fontFamily: "FONTS.regular" },
  cardTitle: { fontSize: 12, fontWeight: "600", color: "#000" },
  cardSubtitle: { fontSize: 12, color: "#666", marginTop: 2, fontFamily: "FONTS.regular" },
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
  radioLabel: { marginLeft: 10, fontSize: 12, color: "#000", fontFamily: "FONTS.regular" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  detailsHeader: { fontSize: 12, fontWeight: "600", marginTop: 10, color: "#000", fontFamily: "FONTS.regular" },
  detailsBox: {
    borderWidth: 1,
    borderColor: "#757875",
    borderRadius: 12,
    paddingHorizontal: 17,
    paddingTop: 20,
    paddingBottom: 5,
    marginTop: 10,
    borderStyle: "dotted",
  },
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
  label: { fontSize: 12, color: "#555", flex: 0.4, textAlign: "left", fontFamily: "FONTS.regular" },
  value: { fontSize: 12, fontWeight: "600", color: "#000", flex: 0.6, textAlign: "right", flexWrap: "wrap", fontFamily: "FONTS.regular" },
  largeButton: { width: "100%", height: 55, paddingVertical: 8, borderRadius: 10 },
  bottomButton: { width: "100%", padding: 10, position: "absolute", bottom: 0, left: 0 },
});

export default AirtimeTopupPay;
