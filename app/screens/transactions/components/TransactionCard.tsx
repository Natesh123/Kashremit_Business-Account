import { View, Text, Image, TextProps, SafeAreaView, TouchableOpacity, RefreshControl } from "react-native";
import React, { useEffect, useState } from "react";
import { FONTS, SIZES } from "../../../constants/Assets";
import COLORS from "../../../constants/Colors";
import { ITransaction } from "types";
import TransactionItem from "./items/TransactionItem";
import Vector from "app/assets/vectors";
import { Menu, MenuOption, MenuOptions, MenuProvider, MenuTrigger } from "react-native-popup-menu";
interface IProps {
  item: any[];
}

const TransactionCard = ({ item }: IProps) => {

  return (
    <View style={{ padding: SIZES.p20, paddingTop: 10 }}> 
      {item && item.map((txn: any, index: number) => (
        <TransactionItem item={txn} key={txn.TransID?.toString() || index} />
      ))}
    </View>
  );
};

export default TransactionCard;
