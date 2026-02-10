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
            <View style={[styles.cardMainWrapper, {margin:20, marginBottom:0}]}> 
               <TouchableOpacity 
  onPress={() => navigation.navigate("MyWalletTransfer")} 
  style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}
>
  <Text
    style={{
      color: theme.colors.color,
      fontSize: SIZES.small,
      fontFamily: FONTS.regular,
      fontWeight:"bold"

    }}
  >
    My Wallet Balance
  </Text>
  <Vector
    as="ionicons"
    name="chevron-forward-outline"
    size={18}
    color={theme.colors.buttonPrimary}
    style={{ marginLeft: 5 }}
  />
</TouchableOpacity>

               
                <Text style={{ color: theme.colors.black50, fontSize:13, fontFamily: FONTS.regular, marginVertical:10 }}>  
                    <Text>{currency}</Text> &nbsp;
                    <Text style={{ color: "#1c1a40", fontFamily: FONTS.semibold, fontSize: 14, marginHorizontal:5}}>
                        {integerPart}
                        <Text style={{color:theme.colors.black50}}>.{decimalPart}</Text>    
                    </Text> 
                    &nbsp; Your Account balance
                </Text> 
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop:10 }}>
                    <View style={{ flex: 1, marginRight:5}}>
                        <Button style={{}} onPress={() => navigation.navigate('withdraw')} outerLine={true}>
                       Withdraw
                        </Button>
                    </View>
                    <View style={{ flex: 1, marginLeft:5 }}>
                        <Button onPress={() => navigation.navigate('AddFund')}>
                        Add Fund
                        </Button>
                    </View>
                </View> 
            </View>
    );
};

export default WalletBalanceCard;
