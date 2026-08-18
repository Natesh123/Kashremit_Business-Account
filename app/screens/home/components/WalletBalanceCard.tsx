import { View, Text, useWindowDimensions, TouchableOpacity } from "react-native";
import React from "react";
import { useRecoilValue } from "recoil";
import { FONTS, SIZES } from "../../../constants/Assets";
import styles from "../../../styles";
import { ProfileState } from "../../../atoms"; 
import { useNavigation } from "@react-navigation/native";
import Button from "app/components/controls/Button";
import { theme } from '../../../core/theme'; 
import Vector from "app/assets/vectors";
interface IProps {
    currency: string;
    balance: string; 
}

const WalletBalanceCard = ({currency,balance}:IProps) => {
    const { width } = useWindowDimensions();
    const navigation = useNavigation();
     const [integerPart, decimalPart] = (balance ?? "0.00").toString().split(".");
    const currentToken = useRecoilValue(ProfileState);

    return (
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, marginHorizontal: 16, marginTop: 24, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: "#E5E7EB" }}> 
               <TouchableOpacity 
                  onPress={() => navigation.navigate("MyWalletTransfer")} 
                  style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
                >
                  <Vector as="ionicons" name="wallet" size={20} color="#316b83" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#316b83', fontSize: 15, fontFamily: FONTS.bold }}>
                    My Wallet Balance
                  </Text>
                  <Vector as="ionicons" name="chevron-forward" size={18} color="#316b83" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '500', marginVertical: 12 }}>  
                    <Text style={{ fontSize: 15 }}>{currency}</Text>
                    <Text style={{ color: "#111827", fontWeight: '700', fontSize: 26 }}> {integerPart}</Text>
                    <Text style={{ fontSize: 15 }}>.{decimalPart} </Text>    
                    Your Account balance
                </Text> 
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('withdraw')} style={{ flex: 1, marginRight: 8, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 24, paddingVertical: 12, alignItems: 'center' }}>
                       <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14 }}>Withdraw</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('AddFund')} style={{ flex: 1, marginLeft: 8, backgroundColor: '#316b83', borderRadius: 24, paddingVertical: 12, alignItems: 'center', shadowColor: "#316b83", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                       <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Add Fund</Text>
                    </TouchableOpacity>
                </View> 
            </View>
    );
};

export default WalletBalanceCard;
