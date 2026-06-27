import { RefreshControl, ScrollView, View, BackHandler } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import Container from "../../theme/Container";
import WalletBalanceCard from "./components/WalletBalanceCard";
import HomeHeader from "../../components/HomeHeader";
import styles from "../../styles";
import { SafeAreaView } from "react-native-safe-area-context";
import SummaryCard from "./components/SummaryCard";
import TransactionCard from "./components/TransactionCard";
import { ITransaction } from "types";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { ProfileState } from "app/atoms";
import { useRecoilValue } from "recoil";
import RateCard from "./components/RateCard";
import moment from "moment";

import { GetDashboardDetails, GetReferDetails, GetRemitterProfile, GetTransactionDetails, GetWalletBalance } from "app/http-services";
import Spinner from "react-native-loading-spinner-overlay";

import FloatingChatbot from "../../components/FloatingChatbot";

const Home = () => {
  const isFocused = useIsFocused();
  const currentToken = useRecoilValue(ProfileState);

  // Handle hardware back button to exit app instead of logging out
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true; // Prevent default behavior
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  const [currency, setCurrency] = useState('£');
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [withdrawAccountBalance, setWithdrawAccountBalance] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [checkRate, setCheckRate] = useState<any[]>([]);
  const [totalBeneficiaries, setTotalBeneficiaries] = useState('');
  const [transactionCount, setTransactionCount] = useState('');
  const [LastMonthSummary, setLastMonthSummary] = useState([]);
  const [RecentTransaction, setRecentTransaction] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReferDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = GetReferDetails(tokenId);
      response.then((res: any) => {
        if (res.status === 200) {
          setReward(res?.data?.Refer?.PotentialEarning);
        }
      })
        .catch((err) => {
          console.error('Fetch refer details', err.response?.data?.message)
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error('Error refer details:', error);
    }
  };

  const fetchDashboardDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = GetDashboardDetails(tokenId);
      response.then((res: any) => {
        if (res.status === 200) {
          setTotalAmount(res?.data?.Dasboard?.TotalAmount);
          setTotalBeneficiaries(res?.data?.Dasboard?.TotalBeneficiaries);
          setTransactionCount(res?.data?.Dasboard?.TransactionCount);
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

  const fetchWalletBalance = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);
      const response = GetWalletBalance(tokenId);
      response.then((res: any) => {
        if (res.status === 200) {
          setAccountBalance(res?.data?.BalanceAmount);
          setWithdrawAccountBalance(res?.data?.WD_BalanceAmount);
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

  const fetchTransactionDetails = async (tokenId: string, remitterId: string) => {
    try {
      setLoading(true);

      const fetchType = (transactionType: string, walletMode: string) => {
        const request = {
          tokenId: tokenId,
          remitterId: remitterId,
          fromDate: '',
          numberTranList: '0',
          toDate: '',
          tranList: 'COUNT',
          transId: '',
          transactionType,
          walletMode,
        };
        return GetTransactionDetails(request).then((res: any) => {
          if (res.status === 200) {
            const list = res?.data?.TransDetails || [];
            if (transactionType === "WALLET") {
              list.forEach((t: any) => {
                t.TransactionType = "WALLET";
                t.transactionType = "WALLET";
              });
            }
            return list;
          }
          return [];
        }).catch((err) => {
          console.error(`Fetch Transaction details for ${transactionType} failed`, err.response?.data?.message || err);
          return [];
        });
      };

      Promise.all([
        fetchType('MONEY_REMITTANCE', 'Sendmoney'),
        fetchType('WALLET', 'Wallet Transfer'),
        fetchType('AIRTOPUP', 'Sendmoney')
      ]).then(([moneyTxns, walletTxns, airtimeTxns]) => {
        let combined = [...(moneyTxns || []), ...(walletTxns || []), ...(airtimeTxns || [])];
        
        // Sorting using parseDateToMoment logic from TransactionItem
        const parseDateToMoment = (rawDate: string | undefined, transaction?: any): moment.Moment => {
          if (!rawDate) return moment(0);

          const isWallet = transaction && (
            transaction.TransactionType === "WALLET" ||
            transaction.transactionType === "WALLET" ||
            (transaction.TransID && transaction.TransID.startsWith("EE"))
          );

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

          if (!isWallet) {
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
            return m;
          }
          return moment(rawDate, formats);
        };

        const sorted = combined.sort((a: any, b: any) => {
          const dateA = parseDateToMoment(a.TransactionDate, a).valueOf();
          const dateB = parseDateToMoment(b.TransactionDate, b).valueOf();
          return dateB - dateA; // descending order (latest first)
        });

        const fixedList = sorted.slice(0, 5).map((t: any) => {
          return {
            ...t,
            TransactionMode:
              !t.TransactionMode || t.TransactionMode.trim() === ""
                ? "E-Wallet Debit"
                : t.TransactionMode,
          };
        });

        setRecentTransaction(fixedList);
      }).catch((err) => {
        console.error('Fetch Transaction details combined failed:', err);
      }).finally(() => {
        setLoading(false);
      });

    } catch (error) {
      console.error('Error fetching Transaction details:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const _currency = process.env.CURRENCY_SYMBOL || '£';
    setCurrency(_currency);
    fetchReferDetails(currentToken.tokenId, currentToken.remitterId);
    fetchTransactionDetails(currentToken.tokenId, currentToken.remitterId);
    fetchWalletBalance(currentToken.tokenId, currentToken.remitterId);
    fetchDashboardDetails(currentToken.tokenId, currentToken.remitterId);
  }, [isFocused]);

  const onRefresh = () => { }

  return (
    <SafeAreaView style={[styles.container]}>
      <HomeHeader name={currentToken.firstName} currency={currency} reward={reward}></HomeHeader>
      <Container>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <WalletBalanceCard currency={currency} balance={accountBalance}></WalletBalanceCard>
          <RateCard></RateCard>
          <SummaryCard currency={currency} value={totalAmount} count={transactionCount} beneficiaries={totalBeneficiaries} ></SummaryCard>
          <TransactionCard item={RecentTransaction}></TransactionCard>
        </ScrollView>
        {loading && <Spinner
          visible={true}
          size='large'
          animation='slide'
        />}
      </Container>
      
    </SafeAreaView>
  );
};

export default Home;
