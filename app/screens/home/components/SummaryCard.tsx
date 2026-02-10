import {
    View,
    Text,
    FlatList,
    useWindowDimensions
} from "react-native";
import React, { useEffect, useState } from "react";
import { SIZES } from "../../../constants/Assets";
import styles from "app/styles";
import SummaryItem from "./items/SummaryItem";
import { useRecoilValue } from "recoil";
import { ProfileState } from "../../../atoms";
import { SummaryModel } from "app/models/summary-model";
import { GetTransactionDetails } from "app/http-services";
import { useIsFocused } from "@react-navigation/native";

type Props = {
    currency: string;
    value: string;
    count: string;
    beneficiaries: string;
};

const SummaryCard = ({ currency }: Props) => {
    const { width } = useWindowDimensions();
    const [loading, setLoading] = useState(false);
    const [RecentTransaction, setRecentTransaction] = useState([]);

    const [transactionValue, setTransactionValue] = useState("0");      // BANK TRANSFER Amount
    const [transactionCount, setTransactionCount] = useState("0");      // Total Count
    const [beneficiariesCount, setBeneficiariesCount] = useState("0");  // BANK TRANSFER Amount (same)

    const isFocused = useIsFocused();
    const currentToken = useRecoilValue(ProfileState);

    // 👉 Fetch API
    const fetchTransactionDetails = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);

            const request = {
                tokenId,
                remitterId,
                fromDate: "",
                numberTranList: "0",
                toDate: "",
                tranList: "COUNT",
                transId: "",
                transactionType: "MONEY_REMITTANCE",
                walletMode: "Sendmoney",
            };

            const response = await GetTransactionDetails(request);

            if (response.status === 200) {
                const fixedList = (response?.data?.TransDetails || []).map((t: any) => ({
                    ...t,
                    TransactionMode:
                        !t.TransactionMode || t.TransactionMode.trim() === ""
                            ? "E-Wallet Debit"
                            : t.TransactionMode,
                }));

                // 👉 Total Transaction Count
                const totalCount = fixedList.length;
                console.log("➡ Total Data Count =", totalCount);

                // 👉 BANK TRANSFER Items
                const bankTransferList = fixedList.filter(
                    (item: any) => item.TransferType === "BANK TRANSFER"
                );

                // 👉 BANK TRANSFER Total Amount
                const bankTransferAmountTotal = bankTransferList.reduce((sum: number, item: any) => {
                    const amt = parseFloat(item.Amount || "0");
                    return sum + (isNaN(amt) ? 0 : amt);
                }, 0);

                console.log("➡ BANK TRANSFER Total Amount =", bankTransferAmountTotal);

                // 👉 Set Values for Summary
                setTransactionValue(bankTransferAmountTotal.toString());   // Transaction Value
                setTransactionCount(totalCount.toString());                // Total Count
                setBeneficiariesCount(bankTransferAmountTotal.toString()); // Beneficiary Received
            }
        } catch (error) {
            console.error("Error fetching Transaction details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactionDetails(currentToken.tokenId, currentToken.remitterId);
    }, [isFocused]);


    // 👉 Summary Data
    const SUMMARY: SummaryModel[] = [
        {
            id: 1,
            title: "Transaction value",
            value: currency + " " + transactionValue,
            icon: "cash",
            columnIndex: 0,
            totalColumns: 0
        },
        {
            id: 2,
            title: "Transaction Count",
            value: transactionCount,
            icon: "arrow-up-circle-sharp",
            columnIndex: 0,
            totalColumns: 0
        },
        {
            id: 3,
            title: "Beneficiary received",
            value: beneficiariesCount,
            icon: "people",
            columnIndex: 0,
            totalColumns: 0
        }
    ];

    return (
        <View>
            <View style={{ flexDirection: 'row', marginHorizontal: 20, alignItems: "center", justifyContent: "space-between" }}>
                <Text style={styles.header}>Last month summary</Text>
            </View>

            <View style={{ flexDirection: "row" }}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={SUMMARY}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingBottom: SIZES.p6 }}
                    renderItem={({ item, index }) => (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}>
                            <SummaryItem
                                id={item.id}
                                title={item.title}
                                value={item.value}
                                icon={item.icon}
                                columnIndex={index}
                                totalColumns={SUMMARY.length}
                            />
                        </View>
                    )}
                />
            </View>
        </View>
    );
};

export default SummaryCard;
