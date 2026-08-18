import { View, Text, FlatList, Image, TextProps, SafeAreaView, TouchableOpacity, RefreshControl } from "react-native";
import React, { useEffect, useState } from "react";
import { FONTS, SIZES } from "../../../constants/Assets";
import COLORS from "../../../constants/Colors";
import { ITransaction } from "types";
import TransactionItem from "./items/TransactionItem";
import Vector from "app/assets/vectors";
import { useNavigation } from "@react-navigation/native";
import styles from "app/styles";
interface IProps {
  item: any[];
}

const TransactionCard = ({ item }: IProps) => {
  const navigation = useNavigation();
  return (
    <View style={{ flexDirection: "column", width: "100%" }}>
      <View style={{ flexDirection: 'row', marginBottom: 16, marginTop: 12, marginHorizontal: 20, alignItems: "center", justifyContent: "space-between", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Vector as="ionicons" name="receipt-outline" size={16} color="#316b83" style={{ marginRight: 6 }} />
                <Text style={{ color: '#316b83', fontSize: 14, fontWeight: "600", letterSpacing: 0.2 }}>Recent transactions</Text>
            </View>
            <View>
                <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
                    <Text style={{ color: '#316b83', fontSize: 14, fontWeight: "600" }}>View All</Text>
                </TouchableOpacity>
            </View>
      </View>
       

      <View
        style={{
          width: '100%',
          flex: 1,
          paddingBottom: SIZES.p40,
          paddingHorizontal: 20,
        }}
      >
        {item && item.map((txn: any) => (
          <TransactionItem key={txn.TransID?.toString()} item={txn} />
        ))}
      </View>

    </View>
  );
};

export default TransactionCard;
