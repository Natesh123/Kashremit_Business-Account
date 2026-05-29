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
      const request = {
        tokenId: tokenId,
        remitterId: remitterId,
        fromDate: '',
        numberTranList: '5',
        toDate: '',
        tranList: 'COUNT',
        transId: '',
        transactionType: 'MONEY_REMITTANCE',
        walletMode: 'Sendmoney'
      }
      const response = GetTransactionDetails(request);
      response.then((res: any) => {
        if (res.status === 200) {

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

          setRecentTransaction(fixedList);
        }
      })
        .catch((err) => {
          console.error('Fetch Transaction details', err.response?.data?.message)
        })
        .finally(() => setLoading(false));
    } catch (error) {
      console.error('Error fetching Transaction details:', error);
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
