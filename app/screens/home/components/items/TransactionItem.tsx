import Vector from "app/assets/vectors";
import { FONTS, IMAGES, SIZES } from "app/constants/Assets";
import Colors from "app/constants/Colors";
import { dateFormat } from "app/helpers";
import styles from "app/styles";
import { TextProps, Text, View, Image, } from "react-native";
import CountryFlag from "react-native-country-flag";
import { ITransaction } from "types";
import moment from "moment";

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

const parseDateToMoment = (rawDate: string | undefined, transaction?: any): moment.Moment => {
  if (!rawDate) return moment(0);

  const isWallet = transaction && (
    transaction.TransactionType === "WALLET" ||
    (transaction.TransID && transaction.TransID.startsWith("EE"))
  );
  
  const isStandard = !isWallet;

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
  
  if (isStandard) {
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
    return moment(rawDate, formats, true);
  }
  m = moment(rawDate);
  if (m.isValid()) {
    return m.local();
  }
  return moment(0);
};

const formatTransactionDate = (date: string, item: any) => {
  const m = parseDateToMoment(date, item);
  return m.valueOf() > 0 ? m.format("DD-MMM-YY hh:mm A") : "";
};

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
            <View style={{ width: SIZES.p40, height: SIZES.p40, borderRadius: 20, backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" }}>
              <Vector as="ionicons" name="wallet" size={24} color="#316b83" />
            </View> 
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
                  {formatTransactionDate(item.TransactionDate, item)}
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