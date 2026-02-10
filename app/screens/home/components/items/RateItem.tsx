import { Image, useColorScheme, useWindowDimensions } from "react-native";
import { RateModel } from 'app/models/rate-model';
import { theme } from '../../../../core/theme';
import { View, Text } from 'app/components/Themed';
import HStack from 'app/components/layout/HStack';
import Animated from 'react-native-reanimated';
import { FONTS, SIZES } from 'app/constants/Assets';
import styles from 'app/styles';
import CountryFlag from "react-native-country-flag";

type Props = RateModel;

 const RateItem = ({ id, fromRate, fromCurrency, toRate, toCurrency, countryCode, countryflag, columnIndex, totalColumns  }: Props) => {
    const getCountryISO2 = require("country-iso-3-to-2");
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === totalColumns - 1;
    const { width } = useWindowDimensions();
    const colorScheme = useColorScheme();
    return (
        <View style={[styles.cardMainWrapper,{ borderRadius:14, paddingHorizontal:12, paddingVertical:14, marginLeft: isFirst ? 20 : 10,
                marginRight: isLast ? 20 : 0, width: (width * 0.50)-25, height:'100%',backgroundColor: "#FFFFFF",}]}>
        
        <View
            style={{
                flexDirection: "row",   
                flex: 1
            }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flexWrap: 'wrap',  
                    flex: 1,
                    backgroundColor:"white"
                }}
            >
                <Text numberOfLines={2} style={{ color: theme.colors.text, flexWrap: "wrap", fontFamily: FONTS.regular, fontSize: SIZES.small, }}>
                {fromRate} {fromCurrency} = {toRate}
                 <Text style={{ color:  theme.colors.black50, fontSize: SIZES.p10, marginLeft:3}}>{toCurrency}</Text> 
                </Text>
            </View>
           <View
      style={{
        width: 33,
        height: 23,
        borderRadius: 6,
        backgroundColor: '#FFFFFF', // White background
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >

                <CountryFlag 
  isoCode={getCountryISO2(countryCode) || ""} 
  size={24} 
/>

                {/* <CountryFlag isoCode={getCountryISO2(countryCode) } size={24} /> */}
            </View>

        </View>

    </View>
    );
};
export default RateItem;