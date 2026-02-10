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


interface IProps {
  item: any;
}

const TransactionItem = ({ item }: IProps) => {
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
        styles.cardMainWrapper,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          width: "100%",
          padding: SIZES.p10,
          borderRadius: SIZES.p20,
        },
      ]}
    >
      {/* --- Country Flag --- */}
      <View
        style={{
          width: SIZES.p40,
          height: SIZES.p40,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: "#eee",
        }}
      >
        {getCountryISO2(item.DestinationCountry) ? (
          <CountryFlag
            style={{ width: SIZES.p40, height: SIZES.p40 }}
            isoCode={getCountryISO2(item.DestinationCountry)}
            size={35}
          />
        ) : (
          <Text style={{ fontSize: 30, fontWeight: "bold" }}>💵</Text>
        )}
      </View>

      {/* --- Receiver Details --- */}
      <View style={{ width: "100%", marginLeft: SIZES.p15, flex: 1 }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, marginBottom: 5 }}>
          {item.ReceiverFirstName} {item.ReceiverLastName}
        </Text>

        <Text style={{ color: Colors.black50, fontFamily: FONTS.regular, fontSize: 12 }}>
          {item.TransactionMode} - {item.TransID}
        </Text>

        <Text style={{ fontFamily: FONTS.light, fontSize: 12, color: Colors.black50, marginTop: 10 }}>
          {dateFormat(item.TransactionDate)}
        </Text>
      </View>

      {/* --- Amount + Date + Status + Buttons --- */}
      <View style={{ paddingRight: SIZES.p10, alignItems: "flex-end" }}>
        <Text style={{ fontFamily: FONTS.semibold, fontSize: 12, }}>
          {item.Currency}
          {item.Amount}
        </Text>



        <Text
          style={{
            fontFamily: FONTS.semibold,
            fontSize: 12,
            color:
              item.TranStatus === "Rejected" || item.TranStatus === "Failed"
                ? "red"
                : item.TranStatus === "Processing"
                  ? "orange"
                  : "green",
            marginTop: 2,
            marginBottom: 8,
          }}
        >
          {item.TranStatus}
        </Text>

        {/* ------------ BUTTONS SECTION ------------ */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>

          {/* 👁️ VIEW BUTTON */}

          <TouchableOpacity
            onPress={() => setShowViewModal(true)}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 12,
              backgroundColor: Colors.primary, // blue button
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: FONTS.semibold,
                color: "#fff",
              }}
            >
              View
            </Text>
          </TouchableOpacity>


          {/* ✅ DOWNLOAD BUTTON (Green) */}
          {item.TranStatus === "Success" && (
            <TouchableOpacity
              onPress={() => handleDownload(item)}
              style={{
                paddingVertical: 4,
                paddingHorizontal: 12,
                backgroundColor: "green",
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: FONTS.semibold,
                  color: "#fff",
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
                borderRadius: 12,
                padding: 20,
                maxHeight: "80%",
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: FONTS.bold }}>
                  Payment Receipt
                </Text>

                <TouchableOpacity onPress={() => setShowViewModal(false)}>
                  <Ionicons name="close" size={26} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ marginTop: 20 }}>

                {(
                  item.TransactionMode === "E-Wallet Debit"
                    ? [
                      { key: "SenderID", label: "Remitted ID", value: item.SenderID },
                      { key: "SenderName", label: "Remitted Name", value: item.SenderFirstName + " " + item.SenderLastName },
                      { key: "ReceiverID", label: "Beneficiary ID", value: item.ReceiverID },
                      { key: "ReceiverName", label: "Beneficiary Name", value: item.ReceiverFirstName + " " + item.ReceiverLastName },
                      { key: "TransactionDate", label: "Transactions Date", value: item.TransactionDate },
                      { key: "TransactionID", label: "Transaction ID", value: item.TransID },
                      { key: "TransactionMode", label: "Transactions Mode", value: item.TransactionMode },
                      { key: "Amount", label: "Transaction amount", value: item.Amount },
                    ]
                    : [
                      { key: "SenderName", label: "Sender Name", value: `${item.SenderFirstName} ${item.SenderLastName}` },
                      { key: "ReceiverName", label: "Receiver Name", value: `${item.ReceiverFirstName} ${item.ReceiverLastName}` },
                      { key: "SourceCountry", label: "Source Country", value: item.SourceCountry },
                      { key: "TransactionDate", label: "Transactions Date", value: item.TransactionDate },
                      { key: "TransactionMode", label: "Transaction Mode", value: item.TransactionMode },
                      { key: "TransactionType", label: "Transaction Type", value: item.TransferType },
                      { key: "Amount", label: "Amount", value: `${item.Currency}${item.Amount}` },
                      { key: "Status", label: "Status", value: item.TranStatus },
                      { key: "TransactionID", label: "Transaction ID", value: item.TransID },
                      { key: "Country", label: "Country", value: item.DestinationCountry },
                    ]
                ).map((row, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      borderWidth: 1,
                      borderColor: "#dcdcdc",
                      marginBottom: -1,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        padding: 10,
                        backgroundColor: "#f4f4f4",
                      }}
                    >
                      <Text style={{ fontFamily: FONTS.semibold }}>{row.label}</Text>
                    </View>

                    <View style={{ flex: 1, padding: 10 }}>
                      <Text style={{ fontFamily: FONTS.regular }}>{row.value}</Text>
                    </View>
                  </View>
                ))}

              </ScrollView>



              {/* Close Button */}
              <TouchableOpacity
                onPress={() => setShowViewModal(false)}
                style={{
                  marginTop: 20,
                  backgroundColor: Colors.primary,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontFamily: FONTS.semibold,
                    fontSize: 14,
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ======================== END VIEW MODAL ========================= */}


      </View>
    </View>
  );

};

export default TransactionItem;
