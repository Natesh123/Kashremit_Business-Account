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
      <View style={{ flexDirection: 'row', marginBottom:20, marginTop:10, marginHorizontal:20, alignItems: "center", justifyContent: "space-between"}}>
            <View>
                <Text style={styles.header}>Recent transactions</Text>
            </View>
            <View>
  <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
    <Vector
      as="materialCI"
      name="filter-variant"
      size={25}
      color={COLORS.black50}
    />
  </TouchableOpacity>
</View>

      </View>
       

      <FlatList
        style={{
          width: '100%',flex: 1,
          
        }}
        
        data={item}
        renderItem={TransactionItem}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.TransID.toString()}
        contentContainerStyle={{ paddingBottom: SIZES.p40, marginHorizontal:20, }} />

    </View>
  );
};

export default TransactionCard;
