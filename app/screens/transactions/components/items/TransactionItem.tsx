import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import CountryFlag from "react-native-country-flag";
import { FONTS, SIZES } from "app/constants/Assets";
import Colors from "app/constants/Colors";
import styles from "app/styles";
import { dateFormat } from "app/helpers";
import { GetReceiverInfoList, GetRemitterProfile, GetTransactionDetails } from "app/http-services";
import { useIsFocused } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { ITransaction } from "types";
import moment from "moment";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import Vector from "app/assets/vectors";

const getLondonOffset = (date: Date): number => {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    const parts = dtf.formatToParts(date);
    const getVal = (type: string) => {
      const part = parts.find(p => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };
    const year = getVal('year');
    const month = getVal('month') - 1;
    const day = getVal('day');
    let hour = getVal('hour');
    if (hour === 24) hour = 0;
    const minute = getVal('minute');
    const second = getVal('second');
    const londonUTCDate = Date.UTC(year, month, day, hour, minute, second);
    const inputUTCDate = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    return (londonUTCDate - inputUTCDate) / 60000;
  } catch (e) {
    console.error("Error computing London offset:", e);
    return 60;
  }
};

const parseDateToMoment = (rawDate: string | undefined, transaction?: any): moment.Moment => {
  if (!rawDate) return moment(0);

  const isWallet = transaction && (
    transaction.TransactionType === "WALLET" ||
    (transaction.TransID && transaction.TransID.startsWith("EE"))
  );
  
  const isStandard = !isWallet;

  const formats = [
    "YYYY-MM-DDTHH:mm:ss[Z]",
    "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
    "YYYY-MM-DD HH:mm:ss",
    "M/D/YYYY h:mm:ss A",
    "MM/DD/YYYY hh:mm:ss A",
    "DD/MM/YYYY hh:mm:ss A",
    "DD/MM/YYYY HH:mm:ss",
    "DD-MM-YYYY hh:mm:ss A",
    "DD-MM-YYYY HH:mm:ss",
    "YYYY-MM-DD hh:mm:ss A",
    "YYYY/MM/DD hh:mm:ss A",
    "DD-MM-YYYY",
    "DD/MM/YYYY",
    "DD-MMM-YYYY",
    "DD MMM, YYYY",
    "YYYY/MM/DD",
    "DD MMM YYYY hh:mm:ss A",
    "DD MMM YYYY"
  ];
  
  if (isStandard) {
    let m = moment.utc(rawDate, formats);
    if (m.isValid()) {
      const utcDate = new Date(m.format("YYYY-MM-DDTHH:mm:ss[Z]"));
      const offset = getLondonOffset(utcDate);
      m.subtract(offset, "minutes");
      return m.local();
    }
  }

  let m = moment.utc(rawDate, formats, true);
  if (m.isValid()) {
    if (rawDate.includes(":") || rawDate.toLowerCase().includes("am") || rawDate.toLowerCase().includes("pm")) {
      return m.local();
    }
    return moment(rawDate, formats, true);
  }
  m = moment(rawDate);
  if (m.isValid()) {
    return m.local();
  }
  return moment(0);
};

const formatTransactionDate = (date: string, item: any) => {
  const m = parseDateToMoment(date, item);
  return m.valueOf() > 0 ? m.format("DD-MMM-YY hh:mm A") : "";
};

const isEmptyValue = (val: any): boolean => {
  if (val === null || val === undefined) return true;
  const str = String(val).trim();
  if (str === "" || str === "null" || str === "undefined" || str === "null null" || str === "undefined undefined") {
    return true;
  }
  return false;
};

const getFullName = (first: string | undefined | null, last: string | undefined | null) => {
  return [first, last].map(s => (s || "").trim()).filter(Boolean).join(" ");
};

interface IProps {
  item: any;
}

const TransactionItem = ({ item }: IProps) => {
  const isWalletTxn = 
    item.TransactionType === "WALLET" ||
    item.TransactionMode === "E-Wallet Debit" ||
    (item.TransID && item.TransID.toString().startsWith("EE"));

  const [showViewModal, setShowViewModal] = useState(false);
  const getCountryISO2 = require("country-iso-3-to-2");
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const currentToken = useRecoilValue(ProfileState);
  const [recipientList, setRecipientList] = useState<any[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<any[]>([]);
  const [remitterProfile, setRemitterProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [transactionType, setTransactionType] =
    useState<"MONEY_REMITTANCE" | "AIRTOPUP">("MONEY_REMITTANCE");

  // ✅ Fetch Receiver List
  const fetchReceiverList = async (tokenId: string, remitterId: string) => {
    try {
      const response = await GetReceiverInfoList(tokenId);
      if (response.status === 200) {
        const _data = response?.data?.ReceiverDetails;

        if (Array.isArray(_data) && _data.length > 0) {
          // Group by country
          const grouped = _data.reduce((acc: any, curr: any) => {
            const country = curr.Country || "Unknown";
            acc[country] = acc[country] ? [...acc[country], curr] : [curr];
            return acc;
          }, {});

          // Sort recipients inside each country
          Object.keys(grouped).forEach((country) => {
            grouped[country].sort((a: { FirstName: any; LastName: any; }, b: { FirstName: any; LastName: any; }) => {
              const nameA = `${a.FirstName || ""} ${a.LastName || ""}`.toLowerCase();
              const nameB = `${b.FirstName || ""} ${b.LastName || ""}`.toLowerCase();
              return nameA.localeCompare(nameB);
            });
          });

          const sortedList = Object.keys(grouped)
            .sort((a, b) => a.localeCompare(b))
            .map((country) => ({
              country,
              recipients: grouped[country],
            }));

          setRecipientList(sortedList);
          setFilteredRecipients(sortedList);
          return sortedList;
        } else {
          setRecipientList([]);
          setFilteredRecipients([]);
          return [];
        }
      }
    } catch (err) {
      console.error("Fetch recipients details:", err);
      return [];
    }
  };

  // ✅ Fetch Remitter Profile
  const fetchRemitterProfile = async (tokenId: string, remitterId: string) => {
    try {
      const response = await GetRemitterProfile(tokenId);
      if (response.status === 200 && response.data.Sender) {
        const profile = response.data.Sender;
        setRemitterProfile(profile);
        return profile;
      }
    } catch (err) {
      console.error("Error fetching Remitter Profile:", err);
      return null;
    }
    return null;
  };
  // ✅ Modified fetchTransactionDetails to return data
  const fetchTransactionDetails = async (
    period: "ALL" | "1MONTH" | "6MONTH" | "1YEAR",
    transType: string
  ) => {
    setLoading(true);
    setTransactionType(transType as any);

    let fromDate = "";
    let toDate = moment().format("YYYY-MM-DD");

    const request = {
      tokenId: currentToken.tokenId,
      remitterId: currentToken.remitterId,
      fromDate,
      toDate,
      numberTranList: "0",
      tranList: "COUNT",
      transId: "",
      transactionType: transType,
      walletMode: "Sendmoney",
    };

    try {
      const res: any = await GetTransactionDetails(request);

      if (res.status === 200 && res.data?.TransDetails?.length > 0) {

        // 🔥 FIX EMPTY TRANSACTION MODE HERE
        const fixedList = (res?.data?.TransDetails || []).map((t: any) => {
          console.log("TransactionMode Raw =>", JSON.stringify(t.TransactionMode));

          return {
            ...t,
            TransactionMode:
              !t.TransactionMode || t.TransactionMode.trim() === ""
                ? "E-Wallet Debit"
                : t.TransactionMode,
          };
        });


        const sorted = fixedList.sort((a: ITransaction, b: ITransaction) =>
          (a.DestinationCountry || "").localeCompare(b.DestinationCountry || "")
        );

        setTransactions(sorted);
        return sorted;
      } else {
        setTransactions([]);
        return [];
      }
    } catch (err: any) {
      console.error("Fetch Transaction details", err.response?.data?.message);
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };





  const handleDownload = async (transactionItem: ITransaction) => {
    try {
      setLoading(true);

      const remitter = await fetchRemitterProfile(
        currentToken.tokenId,
        currentToken.remitterId
      );

      // 👉 If you really need receiver details from API, keep this.
      // But for now we will just pick the first one as before.
      const receiverList = await fetchReceiverList(
        currentToken.tokenId,
        currentToken.remitterId
      );
      const receiveinfo = receiverList?.[0]?.recipients?.[0] || null;

      // ✅ Use the clicked item's data instead of fetching all transactions again
      const transaction = transactionItem;
      console.log("✅ Transaction details:", transaction);

      if (!remitter) {
        Alert.alert(
          "Error",
          "Unable to fetch Remitter details. Please try again."
        );
        return;
      }



      const transactionDateTime = transaction?.TransactionDate || "";
      let txnDate = "--";
      let txnTime = "--";

      if (transactionDateTime) {
        const [datePart, timePart, ampm] = transactionDateTime.split(" ");
        txnDate = datePart || "--";
        txnTime = timePart ? `${timePart} ${ampm || ""}` : "--";
      }

      const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
            .header { text-align: center; }
            .logo { width: 150px; }
            .company { font-size: 12px; margin-top: 10px; }
            .title { font-weight: bold; font-size: 16px; margin: 10px 0; text-transform: uppercase; }
            .txn-id { font-size: 12px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; vertical-align: top; padding: 6px 8px; border: 1px solid #ccc; }
            th { background: #f3f3f3; font-weight: bold; }
            .footer { font-size: 10px; margin-top: 20px; color: #333; line-height: 1.4; text-align: justify; }
            .important { color: red; font-weight: bold; font-size: 11px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="../../assets/logos/logo.png" />
            <div class="company">
              Kashremit Fintech Limited<br/>
              1st Floor, Tidelpark, Adyar, Chennai, India, 600073<br/>
              customersupport@kashremit.com | +44-207 132 0015
            </div>
            <div class="title">CUSTOMER RECEIPT</div>
            <div class="txn-id">TXN ID: ${transaction?.TransID || ""}</div>
          </div>

          <table class="no-border">
            <tr>
              <td><b>Txn. Date:</b> ${txnDate}</td>
              <td><b>Service opted for:</b> ${transaction?.TransferType || ""}</td>
            </tr>
            <tr>
              <td><b>Txn. Time:</b> ${txnTime}</td>
              <td><b>Payout Country:</b> ${transaction?.DestinationCountry || "IND"}</td>
            </tr>
          </table>

          <table>
            <tr>
              <th>BENEFICIARY DETAILS</th>
              <th>PAYMENT DETAILS</th>
            </tr>
            <tr>
              <td>
                Beneficiary Name: ${transaction?.ReceiverFirstName || ""} ${transaction?.ReceiverLastName || ""}<br/>
                Country: ${transaction?.Country || "India"}<br/>
                Acc No. / IBAN: ${receiveinfo?.AccountNumber || "--"}/${receiveinfo?.IFSC_IBAN || "--"}<br/>
                Bank Name / Bank Code: ${receiveinfo?.BankName || "--"}/${receiveinfo?.BankCode || "--"}<br/>
                Bank Branch: ${receiveinfo?.BranchCode || "--"}<br/>
                Mobile: ${receiveinfo?.MobileNumber || "--"}
              </td>
              <td>
                Receive Currency: ${transaction?.DestinationCountry || "--"}<br/>
                Mode of payment: ${transaction?.TransactionMode || "--"}<br/>
                Receive amount: "0.00"<br/>
                Send amount: ${transaction?.Amount || "0.00"}<br/>
                Exchange Rate: "0.000000"<br/>
                Other Taxes: "0.00"<br/>
                Commission: "0.00"<br/>
                Transfer Fee: "0.00"<br/>
                Total: ${transaction?.Amount || "0.00"}<br/>
                Amount in words:"--"<br/>
              </td>
            </tr>
          </table>

          <table>
            <tr><th colspan="2">REMITTER DETAILS</th></tr>
            <tr>
              <td>
                Remitter ID: ${remitter.RemitterID || "--"}<br/>
                Remitter Address: ${remitter.Address1 || ""}, ${remitter.Address2 || ""},
                ${remitter.CountryName || ""}<br/>
                State: ${remitter.State || "--"}<br/>
                Postal Code: ${remitter.PostCode || "--"}<br/>
                Mobile: ${remitter.Mobile || "--"}<br/>
                Source Income: ${remitter.SourceIncome || "--"}<br/>
              </td>
              <td>
                Remitter Name: Mr.${remitter.FirstName || ""} ${remitter.LastName || ""}<br/>
                City: ${remitter.City || "--"}<br/>
                Country: ${remitter.CountryName || "--"}<br/>
                Nationality: ${remitter.Nationality || "--"}<br/>
                Purpose of txn: ${remitter.RemittancePurpose || "Investment in real estate"}
              </td>
            </tr>
          </table>

          <div class="important">Important Notice:</div>
          <div class="footer">
            This transaction is initiated and the payment is received by us on your request and is subject to applicable rules and regulations and terms and conditions.
            <br/><br/>
            1. We shall not be responsible if the information provided by the Sender is inadequate or incorrect.<br/>
            2. We reserve the right to decline/refuse to process this transaction if it is found that the information provided or document(s) submitted by the Sender as proof for processing the transaction is not true and/or valid or violates any applicable law.<br/>
            3. If the Receiver is opting for transaction amount in a different payout currency other than the currency opted by the Sender (if available), then it may cause additional charges to the Receiver.<br/>
            4. Sender is allowed to challenge the error within 13 months and obtain proper rectification.<br/>
            5. For assistance the Sender can contact <b>09999999999</b> or <b>customersupport@kashremit.com</b>.<br/>
            <br/><b>Kashremit is a trading name of Kashremit Fintech Limited and is authorised & regulated by the Financial Conduct Authority.</b>
          </div>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("PDF Generated", "Saved at: " + uri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  };


  // const handleDownload = async () => {
  //   try {
  //     setLoading(true);

  //     const remitter = await fetchRemitterProfile(currentToken.tokenId, currentToken.remitterId);
  //     const receiverList = await fetchReceiverList(currentToken.tokenId, currentToken.remitterId);
  //     const receiveinfo = receiverList?.[0]?.recipients?.[0] || null;
  //     const transactions = await fetchTransactionDetails("ALL", "ALL");
  //     const transaction = transactions?.[0] || null;
  //     console.log("✅ Transaction details:", transaction);

  //     if (!remitter) {
  //       Alert.alert("Error", "Unable to fetch Remitter details. Please try again.");
  //       return;
  //     }

  //     const transactionDateTime = transaction?.TransactionDate || "";
  //     let txnDate = "--";
  //     let txnTime = "--";

  //     if (transactionDateTime) {
  //       const [datePart, timePart, ampm] = transactionDateTime.split(" ");
  //       txnDate = datePart || "--";
  //       txnTime = timePart ? `${timePart} ${ampm || ""}` : "--";
  //     }

  //     // ✅ Define HTML content before using it
  //     const htmlContent = `
  //     <html>
  //       <head>
  //         <style>
  //           body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20px; }
  //           .header { text-align: center; }
  //           .logo { width: 150px; }
  //           .company { font-size: 12px; margin-top: 10px; }
  //           .title { font-weight: bold; font-size: 16px; margin: 10px 0; text-transform: uppercase; }
  //           .txn-id { font-size: 12px; margin-bottom: 10px; }
  //           table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  //           th, td { text-align: left; vertical-align: top; padding: 6px 8px; border: 1px solid #ccc; }
  //           th { background: #f3f3f3; font-weight: bold; }
  //           .footer { font-size: 10px; margin-top: 20px; color: #333; line-height: 1.4; text-align: justify; }
  //           .important { color: red; font-weight: bold; font-size: 11px; margin-top: 20px; }
  //         </style>
  //       </head>
  //       <body>
  //         <div class="header">
  //           <img class="logo" src="../../assets/logos/logo.png" />
  //           <div class="company">
  //             Kashremit Fintech Limited<br/>
  //             1st Floor, Tidelpark, Adyar, Chennai, India, 600073<br/>
  //             customersupport@kashremit.com | +44-207 132 0015
  //           </div>
  //           <div class="title">CUSTOMER RECEIPT</div>
  //           <div class="txn-id">TXN ID: ${transaction?.TransID || "RAU0000011807"}</div>
  //         </div>

  //         <table class="no-border">
  //           <tr>
  //             <td><b>Txn. Date:</b> ${txnDate}</td>
  //             <td><b>Service opted for:</b> ${transaction?.TransferType || ""}</td>
  //           </tr>
  //           <tr>
  //             <td><b>Txn. Time:</b> ${txnTime}</td>
  //             <td><b>Payout Country:</b> ${transaction?.DestinationCountry || "IND"}</td>
  //           </tr>
  //         </table>

  //         <table>
  //           <tr>
  //             <th>BENEFICIARY DETAILS</th>
  //             <th>PAYMENT DETAILS</th>
  //           </tr>
  //           <tr>
  //             <td>
  //               Beneficiary Name: ${receiveinfo?.FirstName || ""} ${receiveinfo?.LastName || ""}<br/>
  //               Country: ${receiveinfo?.Country || "--"}<br/>
  //               Acc No. / IBAN: ${receiveinfo?.AccountNumber || "--"}/${receiveinfo?.IFSC_IBAN || "--"}<br/>
  //               Bank Name / Bank Code: ${receiveinfo?.BankName || "--"}/${receiveinfo?.BankCode || "--"}<br/>
  //               Bank Branch: ${receiveinfo?.BranchCode || "--"}<br/>
  //               Mobile: ${receiveinfo?.MobileNumber || "--"}
  //             </td>
  //             <td>
  //               Receive Currency: ${transaction?.DestinationCountry || "--"}<br/>
  //               Mode of payment: ${transaction?.TransactionMode || "--"}<br/>
  //               Receive amount: "0.00"<br/>
  //               Send amount: ${receiveinfo?.Amount || "4.00"}<br/>
  //               Exchange Rate: "0.000000"<br/>
  //               Other Taxes: "0.00"<br/>
  //               Commission: "0.00"<br/>
  //               Transfer Fee: "0.00"<br/>
  //               Total: ${receiveinfo?.Amount || "10.00"}<br/>
  //               Amount in words:"--"<br/>
  //             </td>
  //           </tr>
  //         </table>

  //         <table>
  //           <tr><th colspan="2">REMITTER DETAILS</th></tr>
  //           <tr>
  //             <td>
  //               Remitter ID: ${remitter.RemitterID || "--"}<br/>
  //               Address: ${remitter.Address1 || ""}, ${remitter.Address2 || ""}<br/>
  //               ${remitter.City || ""}, ${remitter.CountryName || ""}<br/>
  //               Postal: ${remitter.PostCode || "--"}<br/>
  //               Mobile: ${remitter.Mobile || "--"}<br/>
  //             </td>
  //             <td>
  //               Name: ${remitter.FirstName || ""} ${remitter.LastName || ""}<br/>
  //               Nationality: ${remitter.Nationality || "--"}<br/>
  //               Source Income: ${remitter.SourceIncome || "--"}<br/>
  //               Purpose: ${remitter.RemittancePurpose || "--"}
  //             </td>
  //           </tr>
  //         </table>

  //         <div class="important">Important Notice:</div>
  //         <div class="footer">
  //           This transaction is initiated and the payment is received by us on your request and is subject to applicable rules and regulations and terms and conditions.
  //           <br/><br/>
  //           1. We shall not be responsible if the information provided by the Sender is inadequate or incorrect.<br/>
  //           2. We reserve the right to decline/refuse to process this transaction if it is found that the information provided or document(s) submitted by the Sender as proof for processing the transaction is not true and/or valid or violates any applicable law.<br/>
  //           3. If the Receiver is opting for transaction amount in a different payout currency other than the currency opted by the Sender (if available), then it may cause additional charges to the Receiver.<br/>
  //           4. Sender is allowed to challenge the error within 13 months and obtain proper rectification.<br/>
  //           5. For assistance the Sender can contact <b>09999999999</b> or <b>customersupport@kashremit.com</b>.<br/>
  //           <br/><b>Kashremit is a trading name of Kashremit Fintech Limited and is authorised & regulated by the Financial Conduct Authority.</b>
  //         </div>
  //       </body>
  //     </html>
  //   `;

  //     // ✅ Generate PDF only once
  //     const { uri } = await Print.printToFileAsync({ html: htmlContent });
  //     if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(uri); }
  //     else { Alert.alert("PDF Generated", "Saved at: " + uri); }
  //   } catch (error) { console.error(error); Alert.alert("Error", "Failed to generate PDF."); } finally { setLoading(false); }
  // };




  return (
    <View
      style={[
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
          width: "100%",
          padding: 16,
          borderRadius: 16,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2
        },
      ]}
    >
      {/* --- Country Flag --- */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "#F3F4F6",
        }}
      >
        {getCountryISO2(item.DestinationCountry) ? (
          <CountryFlag
            style={{ width: 44, height: 44 }}
            isoCode={getCountryISO2(item.DestinationCountry)}
            size={44}
          />
        ) : (
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" }}>
            <Vector as="ionicons" name="wallet" size={24} color="#316b83" />
          </View> 
        )}
      </View>

      {/* --- Receiver Details --- */}
      <View style={{ width: "100%", marginLeft: 16, flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 15, color: '#111827', marginBottom: 4 }} numberOfLines={1}>
          {item.ReceiverFirstName} {item.ReceiverLastName}
        </Text>

        <Text style={{ color: '#6B7280', fontWeight: '500', fontSize: 13, marginBottom: 4 }} numberOfLines={1}>
          {item.TransactionMode} - {item.TransID}
        </Text>

        <Text style={{ fontWeight: '400', fontSize: 12, color: '#9CA3AF' }}>
          {formatTransactionDate(item.TransactionDate, item)}
        </Text>
      </View>

      {/* --- Amount + Date + Status + Buttons --- */}
      <View style={{ alignItems: "flex-end", justifyContent: 'center' }}>
        <Text style={{ fontWeight: '700', fontSize: 15, color: '#111827' }}>
          {item.Currency}
          {item.Amount}
        </Text>



        <Text
          style={{
            fontWeight: '600',
            fontSize: 12,
            color:
              item.TranStatus === "Rejected" || item.TranStatus === "Failed"
                ? "#EF4444"
                : item.TranStatus === "Processing"
                  ? "#F59E0B"
                  : "#10B981",
            marginTop: 4,
            marginBottom: 10,
          }}
        >
          {item.TranStatus}
        </Text>

        {/* ------------ BUTTONS SECTION ------------ */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>

          {/* 👁️ VIEW BUTTON */}

          <TouchableOpacity
            onPress={() => setShowViewModal(true)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: '#E0F2FE', // soft blue background
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: "#0284C7", // dark blue text
              }}
            >
              View
            </Text>
          </TouchableOpacity>


          {/* ✅ DOWNLOAD BUTTON */}
          {item.TranStatus === "Success" && !isWalletTxn && (
            <TouchableOpacity
              onPress={() => handleDownload(item)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                backgroundColor: "#DCFCE7", // soft green background
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: "#16A34A", // dark green text
                }}
              >
                Download
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {/* ------------ END BUTTONS SECTION ------------ */}

        {/* ======================== VIEW MODAL ========================= */}
        <Modal visible={showViewModal} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <View
              style={{
                width: "100%",
                backgroundColor: "#fff",
                borderRadius: 16,
                maxHeight: "85%",
                overflow: 'hidden',
                marginTop: 60
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "#316b83",
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#fff' }}>
                  Transfer Slip
                </Text>

                <TouchableOpacity onPress={() => setShowViewModal(false)}>
                  <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <View style={{ marginTop: 10 }}>
                  {(
                    item.TransactionMode === "E-Wallet Debit"
                      ? [
                        { key: "SenderID", label: "Remitter ID", value: item.SenderID, icon: "person-outline" },
                        { key: "SenderName", label: "Remitter Name", value: getFullName(item.SenderFirstName, item.SenderLastName), icon: "person-outline" },
                        { key: "ReceiverID", label: "Beneficiary ID", value: item.ReceiverID, icon: "person-circle-outline" },
                        { key: "ReceiverName", label: "Beneficiary Name", value: getFullName(item.ReceiverFirstName, item.ReceiverLastName), icon: "person-circle-outline" },
                        { key: "TransactionDate", label: "Transaction Date", value: item.TransactionDate, icon: "calendar-outline" },
                        { key: "TransactionID", label: "Transaction ID", value: item.TransID, icon: "barcode-outline" },
                        { key: "TransactionMode", label: "Transaction Mode", value: item.TransactionMode, icon: "wallet-outline" },
                        { key: "Amount", label: "Amount", value: item.Amount, icon: "cash-outline" },
                      ]
                      : [
                        { key: "SenderName", label: "Sender Name", value: getFullName(item.SenderFirstName, item.SenderLastName), icon: "person-outline" },
                        { key: "ReceiverName", label: "Receiver Name", value: getFullName(item.ReceiverFirstName, item.ReceiverLastName), icon: "person-circle-outline" },
                        { key: "SourceCountry", label: "Source Country", value: item.SourceCountry, icon: "globe-outline" },
                        { key: "TransactionDate", label: "Transaction Date", value: item.TransactionDate, icon: "calendar-outline" },
                        { key: "TransactionMode", label: "Transaction Mode", value: item.TransactionMode, icon: "card-outline" },
                        { key: "TransactionType", label: "Transaction Type", value: item.TransferType, icon: "swap-horizontal-outline" },
                        { key: "Amount", label: "Amount", value: item.Amount ? `${item.Currency || ""}${item.Amount}`.trim() : "", icon: "cash-outline" },
                        { key: "Status", label: "Status", value: item.TranStatus, icon: "information-circle-outline" },
                        { key: "TransactionID", label: "Transaction ID", value: item.TransID, icon: "barcode-outline" },
                        { key: "Country", label: "Country", value: item.DestinationCountry, icon: "flag-outline" },
                      ]
                  )
                  .filter(row => !isEmptyValue(row.value))
                  .map((row, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6",
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <Vector as="ionicons" name={row.icon} size={18} color="#6B7280" />
                        <Text style={{ fontSize: 14, color: "#6B7280", marginLeft: 8 }}>{row.label}</Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827", textAlign: "right", flex: 1, marginLeft: 16 }}>{row.value}</Text>
                    </View>
                  ))}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setShowViewModal(false)}
                  style={{
                    marginTop: 30,
                    marginBottom: 20,
                    backgroundColor: "#316b83",
                    height: 52,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#316b83",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 6,
                    elevation: 4
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ======================== END VIEW MODAL ========================= */}


      </View>
    </View>
  );

};

export default TransactionItem;
