import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { MetaService } from "app/services/meta.service";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { ProfileState, SelectedRecipientCurrencyState, SelectedSenderCountryDataState, SelectedSenderCurrencyState, SendMoneyTabState } from "app/atoms";
import { TransferTypeListState } from "app/atoms/TransferTypeListState";
import {
  CheckRate,
  SendMoneyCalculate,
  TransferType,
  GetTransactionLimit,
  GetCountryLists
} from "app/http-services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import ModalPicker from "app/components/customComponents/ModalPicker";


const FeeStep = ({
  label,
  value,
  currency = "GBP",
  isLast,
}: {
  label: string;
  value?: string;
  currency?: string;
  isLast?: boolean;
}) => (
  <View style={styles.feeStep}>
    <View style={styles.timelineContainer}>
      <View style={styles.dot} />
      {!isLast && <View style={styles.verticalLine} />}
    </View>
    <View style={styles.feeTextContainer}>
      <Text
        style={[
          styles.feeValueText,
          label.toLowerCase().includes("total") && styles.feeTextBold,
        ]}
      >
        {value ? `${value} ${currency}` : "--"}
      </Text>
      <Text
        style={[
          styles.feeLabelText,
          label.toLowerCase().includes("total") && styles.feeTextBold,
        ]}
      >
        {label}
      </Text>
    </View>
  </View>
);

const BankTransfer = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const currentToken = useRecoilValue(ProfileState);
  const setTransferTypeList = useSetRecoilState(TransferTypeListState);

  const [loading, setLoading] = useState(false);

  /* YOU SEND */
  const [sendCountryList, setSendCountryList] = useState<any[]>([]);
  const [selectedSendCountry, setSelectedSendCountry] = useRecoilState(SelectedSenderCountryDataState);
  const [sendCurrency, setSendCurrency] = useRecoilState(SelectedSenderCurrencyState);

  /* RECIPIENT */
  const [receiveCountryList, setReceiveCountryList] = useState<any[]>([]);
  const [recipientCurrency, setRecipientCurrency] = useRecoilState(SelectedRecipientCurrencyState);

  /* AMOUNTS */
  const [sendAmount, setSendAmount] = useState("1");
  const [recipientAmount, setRecipientAmount] = useState("");
  const [commissionAmount, setCommissionAmount] = useState("");
  const [chargedAmount, setChargedAmount] = useState("");
  const [creditedAmount, setCreditedAmount] = useState("");

  /* OTHERS */
  const [checkrateList, setCheckrateList] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [isSwapped, setIsSwapped] = useState(false);
  const [hasTransactionError, setHasTransactionError] = useState(false);
  const modalShownRef = React.useRef(false);


  const banksRate = checkrateList?.find(
    (i: any) => i.TransferType === "Banks"
  );

  // --- Combined List for Pickers ---
  const combinedCountryList = useMemo(() => {
    const map = new Map();
    // Prefer objects from send list as they have the correct CurrencyCode displayvalue
    sendCountryList.forEach(item => map.set(item.dataValue, item));
    // Add missing ones from receive list
    receiveCountryList.forEach(item => {
      if (!map.has(item.dataValue)) {
        map.set(item.dataValue, item);
      }
    });
    return Array.from(map.values());
  }, [sendCountryList, receiveCountryList]);


  const tabIndex = useRecoilValue(SendMoneyTabState);

  // Reset amount whenever screen comes into focus (handles navigation back)
  useFocusEffect(
    useCallback(() => {
      const resetAmount = async () => {
        // Clear persisted sendAmount from previous transaction
        await AsyncStorage.removeItem("sendAmount");
        setSendAmount("1");
        setRecipientAmount("");
        setCommissionAmount("");
        setChargedAmount("");
        setHasTransactionError(false);
        setIsSwapped(false);
        modalShownRef.current = false;
      };
      resetAmount();
    }, [])
  );

  useEffect(() => {
    if (tabIndex === 1) { // Index for BankTransfer
      console.log("BankTransfer Tab Active - Fetching Data");
      // Reset 'You Send' on every tab focus
      setSendAmount("1");
      setRecipientAmount("");
      setCommissionAmount("");
      setChargedAmount("");
      setHasTransactionError(false); // Reset error state
      modalShownRef.current = false; // Reset modal shown flag

      const initData = async () => {
        // Clear persisted sendAmount from previous transaction
        await AsyncStorage.removeItem("sendAmount");

        fetchSendCountries();
        fetchReceiveCountries();
        fetchTransfertype();
        fetchCheckRate();

        // Load last selected recipient country from AsyncStorage, default to IND if not found
        const storedRecipient = await AsyncStorage.getItem("selectedRecipientCurrency");
        if (storedRecipient) {
          setRecipientCurrency(storedRecipient);
          // Explicitly call fetchSendMoney for the default amount of 1
          await fetchSendMoney("1", storedRecipient);
        } else {
          setRecipientCurrency("IND");
          await AsyncStorage.setItem("selectedRecipientCurrency", "IND");
          // Explicitly call fetchSendMoney for the default amount of 1
          await fetchSendMoney("1", "IND");
        }
      };
      initData();
    }
  }, [tabIndex]);

  // Removed standard useEffect mount as tabIndex effect handles it
  /*
  useEffect(() => {
    fetchSendCountries();
    fetchReceiveCountries();
    fetchTransfertype();
    fetchCheckRate();
  }, []);
  */

  useEffect(() => {
    if (sendAmount && !isNaN(Number(sendAmount))) {
      fetchSendMoney(sendAmount, recipientCurrency || "IND", selectedSendCountry?.dataValue);
    }
  }, [sendAmount, recipientCurrency, selectedSendCountry?.dataValue]);

  /* ---------------- YOU SEND ---------------- */
  const fetchSendCountries = () => {
    setLoading(true);
    MetaService.fetchCountryMeta(
      true,
      false,
      false,
      async (countries: any[]) => {
        const list = countries.map((c) => ({
          dataValue: c.Alpha_3_Code,
          displayvalue: c.CurrencyCode ?? c.Alpha_3_Code,
          flag: c.Alpha_2_Code
            ? `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`
            : null,
        }));
        setSendCountryList(list);

        // Set initial country and currency (amount is already set to "1" in tab focus useEffect)
        let initialCountry = list[0];
        let initialCurrency = list[0]?.displayvalue || "GBP";

        setSelectedSendCountry(initialCountry);
        setSendCurrency(initialCurrency);

        if (initialCountry?.displayvalue) {
          AsyncStorage.setItem("selectedSendCurrency", initialCountry.displayvalue);
        }

        if (initialCountry?.dataValue) {
          AsyncStorage.setItem("selectedCountryDisplayValue", initialCountry.dataValue);
          // Don't call fetchSendMoney here, it will be triggered by the useEffect watching sendAmount
        }
      },
      () => { },
      () => setLoading(false)
    );
  };

  /* ---------------- SEND MONEY CALC ---------------- */
  const fetchCheckRate = async (toCountryCode?: string, fromCountryCode?: string) => {
    try {
      const finalTo = toCountryCode || await AsyncStorage.getItem("selectedRecipientCurrency") || recipientCurrency || "IND";
      const finalFrom = fromCountryCode || await AsyncStorage.getItem("selectedCountryDisplayValue") || selectedSendCountry?.dataValue || "GBR";

      const response = await CheckRate(finalTo, finalFrom);
      if (response.status === 200 && response.data?.TransferDetails?.TDFields) {
        setCheckrateList(response.data.TransferDetails.TDFields);
      }
    } catch (err) {
      console.error("fetchCheckRate error:", err);
    }
  };

  const fetchSendMoney = async (amount: any, toCountry?: string, fromCountry?: string, reverse?: string) => {
    if (!amount) return;
    try {
      setLoading(true);
      const finalTo = toCountry || await AsyncStorage.getItem("selectedRecipientCurrency") || recipientCurrency || "IND";
      const finalFrom = fromCountry || await AsyncStorage.getItem("selectedCountryDisplayValue") || selectedSendCountry?.dataValue || "GBR";

      const finalCurrency = await AsyncStorage.getItem("selectedSendCurrency") || sendCurrency || "GBP";
      const actualReverse = reverse !== undefined ? reverse : (isSwapped ? finalCurrency : "");
      const isReverseActive = actualReverse !== "";

      const res: any = await SendMoneyCalculate(
        Number(amount),
        finalTo,
        finalFrom,
        actualReverse
      );

      if (res.status === 200 && res.data) {
        // Check for error status code ER1111
        if (res.data.StatusCode === "ER1111") {
          setHasTransactionError(true); // Always set error state

          // Only show modal if: 1) hasn't been shown yet, 2) modal not visible, 3) THIS tab is active
          if (!modalShownRef.current && !modalVisible && tabIndex === 1) {
            setWarningMsg(res.data.StatusMsg || "Transaction limit exceeded");
            modalShownRef.current = true; // Mark modal as shown
            setModalVisible(true);
          }
          return;
        }

        // Reset error state on successful response
        setHasTransactionError(false);

        const data = res.data?.data || res.data;
        AsyncStorage.setItem("SessionCode", res.data.SessionCode);

        const comm = data?.SenderPayerProposal?.CommisionAmount?.Amount?.toString() || "0";
        const total = data?.SenderPayerProposal?.ChargedAmount?.Amount?.toString() || "0";
        const cred = data?.SenderPayerProposal?.CreditedAmount?.Amount?.toString() || "0";

        // When swapped, show InitialAmount. When not swapped, show CreditedAmount.
        const recv = isReverseActive
          ? data?.SenderPayerProposal?.InitialAmount?.Amount?.toString() || "0"
          : data?.SenderPayerProposal?.CreditedAmount?.Amount?.toString() || "0";

        setCommissionAmount(comm);
        setChargedAmount(total);
        setCreditedAmount(cred);
        setRecipientAmount(recv);
      }
    } catch (err) {
      console.error("fetchSendMoney error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfertype = async (toCountryCode?: string, fromCountryCode?: string) => {
    try {
      const finalTo = toCountryCode || await AsyncStorage.getItem('selectedRecipientCurrency') || recipientCurrency || "IND";
      const finalFrom = fromCountryCode || await AsyncStorage.getItem('selectedCountryDisplayValue') || selectedSendCountry?.dataValue || "GBR";

      const response = await TransferType(finalTo, finalFrom);
      const tdFields = response?.data?.TransferDetails?.TDFields;

      if (response?.status === 200 && Array.isArray(tdFields)) {
        const transferTypes = tdFields.map((item: any) => item.TransferType);
        setTransferTypeList(transferTypes);
      }
    } catch (err) {
      console.error("fetchTransfertype error:", err);
    }
  };

  const fetchReceiveCountries = async () => {
    setLoading(true);
    MetaService.fetchCountryMetas(
      false,
      true,
      false,
      async (countries: any[]) => {
        const list = countries.map((c) => ({
          dataValue: c.Alpha_3_Code,
          displayvalue: c.Alpha_3_Code,
          flag: c.Alpha_2_Code
            ? `https://flagcdn.com/w40/${c.Alpha_2_Code.toLowerCase()}.png`
            : null,
        }));
        setReceiveCountryList(list);
      },
      () => setLoading(false),
      () => setLoading(false)
    );
  };

  const onSendMoney = async () => {
    try {
      setLoading(true);
      const sessionCode = await AsyncStorage.getItem("SessionCode");

      await AsyncStorage.setItem("Transfer Fee", String(commissionAmount ?? '0'));
      const amountToBePaid = isSwapped
        ? (Number(creditedAmount || 0) + Number(commissionAmount || 0)).toString()
        : String(chargedAmount ?? '0');
      await AsyncStorage.setItem("Amount to be paid", amountToBePaid);
      await AsyncStorage.setItem("Amount we'll convert", recipientAmount);
      await AsyncStorage.setItem("sendAmount", sendAmount);
      await AsyncStorage.setItem("ConversionRate", recipientAmount);
      await AsyncStorage.setItem("selectedRecipientCurrency", recipientCurrency || "IND");
      await AsyncStorage.setItem("ChannelTransferType", "BANKS");

      const req = {
        SendAmount: Number(sendAmount),
        fromcountry: selectedSendCountry?.dataValue || "GBR",
        currency: sendCurrency || "GBP",
        sessionCode: sessionCode,
        tocountry: recipientCurrency || "IND",
        tokenId: currentToken.tokenId,
        remitterId: currentToken.remitterId,
      };

      const response = await GetTransactionLimit(req);
      if (response?.data?.StatusCode === "ER00119") {
        setWarningMsg(response.data.StatusMsg);
        setModalVisible(true);
        return;
      }
      navigation.navigate('Recipient', { data: response.data });
    } catch (error) {
      console.error("onSendMoney error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = sendAmount && !isNaN(Number(sendAmount)) && !hasTransactionError;


  const handleSwap = () => {
    const nextSwapped = !isSwapped;
    setIsSwapped(nextSwapped);
    // Pass the actual currency if swapping ON, otherwise "" as per requirement
    fetchSendMoney(sendAmount, undefined, undefined, nextSwapped ? (sendCurrency || "") : "");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading && (
        <ActivityIndicator size="large" color="#316b83" style={{ marginTop: 10 }} />
      )}
      <View style={[styles.card, { width: width - 32 }]}>
        <Text style={styles.label}>You Send</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={sendAmount}
            onChangeText={(t) => {
              setSendAmount(t.replace(/[^0-9]/g, ""));
            }}
          />

          <View style={{ width: 100, marginRight: 24 }}>
            <ModalPicker
              selectedValue={isSwapped ? recipientCurrency : selectedSendCountry?.dataValue}
              onValueChange={(val: any) => {
                if (isSwapped) {
                  setRecipientCurrency(val);
                  AsyncStorage.setItem("selectedRecipientCurrency", val);
                  fetchSendMoney(sendAmount, val, selectedSendCountry?.dataValue, sendCurrency || "");
                  fetchTransfertype(val, selectedSendCountry?.dataValue);
                  fetchCheckRate(val, selectedSendCountry?.dataValue);
                } else {
                  const c = sendCountryList.find(item => item.dataValue === val);
                  if (c) {
                    setSelectedSendCountry(c);
                    setSendCurrency(c.displayvalue);
                    AsyncStorage.setItem("selectedSendCurrency", c.displayvalue);
                    AsyncStorage.setItem("selectedCountryDisplayValue", c.dataValue);
                    fetchTransfertype(recipientCurrency || "IND", c.dataValue);
                    fetchCheckRate(recipientCurrency || "IND", c.dataValue);
                    fetchSendMoney(sendAmount, recipientCurrency || "IND", c.dataValue, "");
                  }
                }
              }}
              dataList={isSwapped ? receiveCountryList : sendCountryList}
              placeholder="Select"
              searchPlaceholder="Search country"
            />
          </View>
        </View>
      </View>
      {/* REFINED SWAP UI */}
      <View style={[styles.refinedSwapContainer, { width: width - 32 }]}>
        <View style={styles.dividerLine} />
        <TouchableOpacity style={styles.refinedSwapButton} onPress={handleSwap}>
          <Ionicons name="swap-vertical" size={24} color="#316b83" />
        </TouchableOpacity>
      </View>

      {/* Expandable Fee Details */}
      <View style={{ width: width - 30, position: "relative", marginBottom: 20 }}>
        {isExpanded && (
          <View style={styles.feeBox}>
            <FeeStep currency={sendCurrency || "GBP"} label="Our fee" value={commissionAmount} />
            <FeeStep currency={sendCurrency || "GBP"} label="Total Amount" value={chargedAmount} />
            <FeeStep
              currency={sendCurrency || "GBP"}
              label="Conversion Rate"
              value={recipientAmount}
              isLast
            />
          </View>
        )}
      </View>

      <View style={[styles.card, { width: width - 32 }]}>
        <Text style={styles.label}>Recipient Gets</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={recipientAmount}
            editable={false}
          />

          <View style={{ width: 100, marginRight: 24 }}>
            <ModalPicker
              selectedValue={isSwapped ? selectedSendCountry?.dataValue : recipientCurrency}
              onValueChange={(val: any) => {
                if (isSwapped) {
                  const c = sendCountryList.find(item => item.dataValue === val);
                  if (c) {
                    setSelectedSendCountry(c);
                    setSendCurrency(c.displayvalue);
                    AsyncStorage.setItem("selectedSendCurrency", c.displayvalue);
                    AsyncStorage.setItem("selectedCountryDisplayValue", c.dataValue);
                    fetchTransfertype(recipientCurrency || "IND", c.dataValue);
                    fetchCheckRate(recipientCurrency || "IND", c.dataValue);
                    fetchSendMoney(sendAmount, recipientCurrency || "IND", c.dataValue, c.displayvalue || "");
                  }
                } else {
                  setRecipientCurrency(val);
                  AsyncStorage.setItem("selectedRecipientCurrency", val);
                  fetchSendMoney(sendAmount, val, selectedSendCountry?.dataValue, "");
                  fetchTransfertype(val, selectedSendCountry?.dataValue);
                  fetchCheckRate(val, selectedSendCountry?.dataValue);
                }
              }}
              dataList={isSwapped ? sendCountryList : receiveCountryList}
              placeholder="Select"
              searchPlaceholder="Search country"
            />
          </View>
        </View>
      </View>

      {/* Send Button */}
      <TouchableOpacity
        style={[
          { width: width - 32, borderRadius: 12, opacity: isFormValid ? 1 : 0.5 },
        ]}
        onPress={onSendMoney}
        disabled={!isFormValid}
      >
        <LinearGradient
          colors={["#316b83", "#8bacb9"]}
          start={[0, 0]}
          end={[1, 0]}
          style={styles.sendButton}
        >
          <Text style={styles.sendText}>Send money</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ⚠️ Warning Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          modalShownRef.current = false; // Reset when modal is closed
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>⚠️ Rate Update</Text>
            <Text style={styles.modalMessage}>{warningMsg}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                modalShownRef.current = false; // Reset when OK is clicked
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default BankTransfer;

const styles = StyleSheet.create({
  container: { paddingVertical: 16, alignItems: "center", backgroundColor: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 24, marginBottom: 16, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontSize: 13, fontFamily: "SF Pro Display", color: "black", marginBottom: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#eef0f2", borderRadius: 12, paddingHorizontal: 16, height: 56, fontSize: 16, fontFamily: "SF Pro Display", color: "#333", backgroundColor: "#fff" },
  dropdown: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#f0f0f0", borderRadius: 8 },
  dropdownText: { fontWeight: "bold" },
  flagIcon: {
    marginLeft: 10,
    width: 24,
    height: 18,
    marginRight: 8,
  },
  dropdownItemText: {
    fontSize: 14,
  },

  feeBox: { backgroundColor: "#fff", borderRadius: 24, padding: 24, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 10 },
  feeStep: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  feeTextContainer: { flexDirection: "row", alignItems: "center", marginLeft: 16 },
  feeValueText: { fontSize: 15, fontFamily: "SF Pro Display", color: "#333", marginRight: 6 },
  feeLabelText: { fontSize: 15, fontFamily: "SF Pro Display", color: "#333" },
  feeTextBold: { fontWeight: "700", color: "#1a1a1a" },
  timelineContainer: { position: "relative", width: 12, alignItems: "center", marginTop: 4 },
  dot: { width: 10, height: 10, backgroundColor: "#e2e4e7", borderRadius: 5, zIndex: 1 },
  verticalLine: { width: 2, height: 40, backgroundColor: "#e2e4e7", position: "absolute", top: 10 },
  expandIcon: { position: "absolute", right: 20, top: "50%", marginTop: -22, height: 44, width: 44, borderRadius: 22, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sendButton: { paddingVertical: 18, alignItems: "center", borderRadius: 12, marginTop: 40 },
  sendText: { color: "#fff", fontWeight: "700", fontSize: 16, fontFamily: "SF Pro Display" },
  // Modal styles
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalBox: { backgroundColor: "#fff", borderRadius: 12, padding: 25, width: "80%", alignItems: "center" },
  modalMessage: { fontSize: 12, fontFamily: "SF Pro Display", color: "#333", textAlign: "center", marginBottom: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "SF Pro Display",
    color: "#333",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  modalSearchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: "SF Pro Display",
    color: "#333",
    borderWidth: 0,
    // @ts-ignore - web only property
    outlineStyle: "none",
  },
  countryListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  countryListFlag: {
    width: 32,
    height: 22,
    borderRadius: 4,
    marginRight: 15,
  },
  countryListText: {
    fontSize: 16,
    fontFamily: "SF Pro Display",
    color: "#333",
    fontWeight: "500",
  },
  modalButton: { backgroundColor: "#316b83", paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
  modalButtonText: { color: "#fff", fontWeight: "bold" },
  refinedSwapContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Align items to the right
    height: 44,
    marginVertical: -22, // Overlap the two sections
    zIndex: 10,
  },
  dividerLine: {
    position: "absolute",
    left: 0,
    right: 22, // Stop before the button
    height: 1,
    backgroundColor: "#eef0f2",
  },
  refinedSwapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
});
