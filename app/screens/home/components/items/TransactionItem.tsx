import Vector from "app/assets/vectors";
import { FONTS, IMAGES, SIZES } from "app/constants/Assets";
import Colors from "app/constants/Colors";
import { dateFormat } from "app/helpers";
import styles from "app/styles";
import { TextProps, Text, View, Image, } from "react-native";
import CountryFlag from "react-native-country-flag";
import { ITransaction } from "types";

interface IProps {
  item: any;
}

const TransactionItem = ({ item }: IProps) => {
  const getCountryISO2 = require("country-iso-3-to-2");
  const isoCode = getCountryISO2(item.DestinationCountry) || "";

  return (
    <View style={[styles.cardMainWrapper, { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 10, width: '100%', padding: SIZES.p10, borderRadius: SIZES.p20 }]}>
      <View style={{ width: SIZES.p40, height: SIZES.p40, borderRadius: 10, alignItems: "center", overflow: "hidden" }}>
        

        {
          isoCode ? (
            <CountryFlag
              style={{ width: SIZES.p40, height: SIZES.p40 }}
              isoCode={isoCode}
              size={35}
            />
          ) : (
            <Text style={{ fontSize: 30 }}>💵</Text>  
          )
        }

      </View>
      <View style={{ width: "100%", marginLeft: SIZES.p15, flex: 1, alignSelf: "flex-start" }}>
        <Text style={{
          fontFamily: FONTS.semibold,
          fontWeight: "500",
          fontSize: 12,
          marginBottom: 5, textTransform: "capitalize"
        }}>
          {item.ReceiverFirstName}  {item.ReceiverLastName}
        </Text>
        <Text style={{ color: Colors.black50, fontFamily: FONTS.regular, fontSize: 12, }}>
          {item.TransactionMode} - {item.TransID}
        </Text>
        <Text style={{ fontFamily: FONTS.light, fontSize: 12, color: Colors.black50, marginTop:10 }}>
                  {dateFormat(item.TransactionDate)}
                </Text>
      </View>
      <View style={{ paddingRight: SIZES.p15 }}>
        <Text
          style={{
            fontFamily: FONTS.semibold,
            alignSelf: "flex-end",
            fontSize: 12
          }}>
          {item.Currency}{item.Amount}
        </Text>
        {/* <Text style={{ fontFamily: FONTS.light, fontSize: 12, color: Colors.black50 }}>
          {dateFormat(item.TransactionDate)}
        </Text> */}
        {/* <Text
          style={{
            fontFamily: FONTS.semibold,
            alignSelf: "flex-end",
            color: "green",
            fontSize: 12
          }}>
          {item.TranStatus}
        </Text> */}
       <Text
  style={{
    fontFamily: FONTS.semibold,
    fontSize: 12,
    color:
      item.TranStatus === "Rejected" || item.TranStatus === "Failed"
        ? "red"
        : item.TranStatus === "Processing"
        ? "orange"
        : "green",
    marginTop: 2,
    marginBottom: 8,
  }}
>
  {item.TranStatus}
</Text>

      </View>
    </View>
  );
};

export default TransactionItem;