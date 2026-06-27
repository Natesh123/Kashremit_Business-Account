import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import Spinner from "react-native-loading-spinner-overlay";
import moment from "moment";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";

import styles from "app/styles";
import HomeHeader from "app/components/HomeHeader";
import Container from "app/theme/Container";
import { SIZES } from "app/constants/Assets";
import { ITransaction } from "types";
import { ProfileState } from "app/atoms";
import TransactionCard from "./components/TransactionCard";
import { GetReferDetails, GetTransactionDetails } from "app/http-services";
import GroupButton from "app/components/controls/GroupButton";
import { theme } from "app/core/theme";
import Vector from "app/assets/vectors";

const Transactions = () => {
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const currentToken = useRecoilValue(ProfileState);

  const [currency, setCurrency] = useState("£");
  const [transactionType, setTransactionType] =
    useState<"MONEY_REMITTANCE" | "AIRTOPUP" | "WALLET_TRANSFER">("MONEY_REMITTANCE");
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState("");
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch refer details
  const fetchReferDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await GetReferDetails(currentToken.tokenId);
      if (res?.status === 200) {
        setReward(res?.data?.Refer?.PotentialEarning || "");
      }
    } catch (err: any) {
      console.error("Fetch refer details:", err.response?.data?.message || err);
    } finally {
      setLoading(false);
    }
  }, [currentToken.tokenId]);

  // Fetch transactions
  const fetchTransactionDetails = useCallback(
    async (
      period: "ALL" | "1MONTH" | "6MONTH" | "1YEAR",
      transType: "MONEY_REMITTANCE" | "AIRTOPUP" | "WALLET_TRANSFER"
    ) => {
      setLoading(true);
      setTransactionType(transType);

      let fromDate = "";
      const toDate = moment().format("YYYY-MM-DD");

      if (period !== "ALL") {
        const periods: Record<string, moment.unitOfTime.DurationConstructor> = {
          "1MONTH": "months",
          "6MONTH": "months",
          "1YEAR": "years",
        };
        const value = period === "6MONTH" ? 6 : period === "1YEAR" ? 1 : 1;
        fromDate = moment().subtract(value, periods[period]).format("YYYY-MM-DD");
      }

      const request = {
        tokenId: currentToken.tokenId,
        remitterId: currentToken.remitterId,
        fromDate,
        toDate,
        numberTranList: "0",
        tranList: "COUNT",
        transId: "",
        transactionType: transType === "WALLET_TRANSFER" ? "WALLET" : transType,
        walletMode: transType === "WALLET_TRANSFER" ? "Wallet Transfer" : "Sendmoney",
      };

      try {
        const res: any = await GetTransactionDetails(request);
        if (res.status === 200) {
          const fixedList = (res?.data?.TransDetails || []).map((t: any) => ({
            ...t,
            TransactionMode:
              !t.TransactionMode || t.TransactionMode.trim() === ""
                ? "E-Wallet Debit"
                : t.TransactionMode,
          }));

          const sorted = fixedList.sort((a: ITransaction, b: ITransaction) =>
            (a.DestinationCountry || "").localeCompare(b.DestinationCountry || "")
          );

          setTransactions(sorted);
        }
      } catch (err: any) {
        console.error("Fetch Transaction details:", err.response?.data?.message || err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentToken.tokenId, currentToken.remitterId]
  );

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || "£";
    setCurrency(_currency);
    fetchReferDetails();
    fetchTransactionDetails("ALL", transactionType);
  }, [isFocused, fetchReferDetails, fetchTransactionDetails, transactionType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactionDetails("ALL", transactionType);
  };

  const onChangeTransactionType = (selected: string) => {
    const type = selected === "Airtime Topup" ? "AIRTOPUP" : selected === "Wallet Transfer" ? "WALLET_TRANSFER" : "MONEY_REMITTANCE";
    fetchTransactionDetails("ALL", type);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#316b83' }]}>
      <HomeHeader
        name={currentToken.firstName}
        currency={currency}
        reward={reward}
      />

      <Container style={{ backgroundColor: '#f9f9f9', flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 70 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View>
            {/* Group Buttons */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                margin: 15,
              }}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <GroupButton
                  width={width * 0.35}
                  onPress={onChangeTransactionType}
                  buttons={["Money Transfer", "Airtime Topup", "Wallet Transfer"]}
                />
              </ScrollView>
            </View>

            {/* Transactions Header with Filter */}
            <View
              style={{
                flexDirection: "row",
                marginTop: 10,
                marginHorizontal: 20,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.header}>Transactions</Text>

              <Menu>
                <MenuTrigger>
                  <View
                    style={{
                      padding: 6,
                      borderRadius: 10,
                      backgroundColor: "#f2f2f2",
                      elevation: 4,
                    }}
                  >
                    <Vector
                      as="materialCI"
                      name="filter-variant"
                      size={24}
                      color={theme.colors.black50}
                    />
                  </View>
                </MenuTrigger>

                <MenuOptions
                  customStyles={{
                    optionsContainer: {
                      backgroundColor: "#FFFFFF",
                      paddingVertical: 8,
                      borderRadius: 14,
                      width: 170,
                      elevation: 10,
                      shadowColor: "#000",
                      shadowOpacity: 0.15,
                      shadowOffset: { width: 0, height: 3 },
                      shadowRadius: 6,
                    },
                  }}
                >
                  {[
                    { label: "🔄 Reset", period: "ALL" },
                    { label: "📅 Last month", period: "1MONTH" },
                    { label: "📆 Last 6 months", period: "6MONTH" },
                    { label: "🗓️ Last 1 year", period: "1YEAR" },
                  ].map((opt) => (
                    <MenuOption
                      key={opt.period}
                      onSelect={() => fetchTransactionDetails(opt.period as any, transactionType)}
                    >
                      <Text style={menuStyles.option}>{opt.label}</Text>
                    </MenuOption>
                  ))}
                </MenuOptions>
              </Menu>
            </View>

            {/* Transactions List */}
            <TransactionCard item={transactions} />
          </View>
        </ScrollView>

        {/* Loader */}
        {loading && <Spinner visible={true} size="large" animation="slide" />}
      </Container>
    </SafeAreaView>
  );
};

export default Transactions;

const menuStyles = {
  option: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#333",
    fontWeight: "500" as any,
  },
};
