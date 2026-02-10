import { View, FlatList, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { SIZES } from "../../../constants/Assets";
import { GetQuickWatchList } from "app/http-services";
import { ProfileState } from "app/atoms";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RateItem from "./items/RateItem";

const RateCard = () => {
  const currentToken = useRecoilValue(ProfileState);
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [watchList, setWatchList] = useState<any[]>([]);

  const fallbackList = [
    {
      id: 1,
      fromRate: "1",
      fromCurrency: "GBR",
      toRate: "110.99",
      toCurrency: "INR",
      countryCode: "IND",
      countryflag: "http://cashrest.tastybreadhouse.co.uk/CountryFlags/IND.png",
    },
    {
      id: 2,
      fromRate: "1",
      fromCurrency: "GBR",
      toRate: "433.32",
      toCurrency: "LKR",
      countryCode: "LKA",
      countryflag: "http://cashrest.tastybreadhouse.co.uk/CountryFlags/LKA.png",
    },
  ];

  useEffect(() => {
    if (isFocused) fetchQuickWatchList();
  }, [isFocused]);

  const fetchQuickWatchList = async () => {
    try {
      const req = { RemitterID: currentToken?.remitterId };
      const response = await GetQuickWatchList(req);

      if (
        response.data.StatusCode === "ER0000" &&
        Array.isArray(response.data.Quickwatchdetail)
      ) {
        const mapped = response.data.Quickwatchdetail.map((x: { ExchangeCheckRate: { toString: () => any; }; ToCurrency: any; ToCountryCode: any; CountryFlag: any; }, index: number) => ({
          id: index + 1,
          fromRate: "1",
          fromCurrency: "GBR",
          toRate: x.ExchangeCheckRate?.toString() ?? "0",
          toCurrency: x.ToCurrency,
          countryCode: x.ToCountryCode,
          countryflag: x.CountryFlag,
        }));

        setWatchList(mapped);
      } else {
        setWatchList([]);
      }
    } catch (error) {
      console.log("Error:", error);
      setWatchList([]);
    }
  };

  const finalData = watchList.length > 0 ? watchList : fallbackList;

  const onSelectCountry = async (code: string) => {
    try {
      await AsyncStorage.setItem("selectedRecipientCurrency", code);

      console.log("Saved selectedRecipientCurrency:", code);

      navigation.navigate("SendMoney"); // <-- Navigate to SendMoney page

    } catch (error) {
      console.log("AsyncStorage Error:", error);
    }
  };

  return (
    <View style={{ flexDirection: "row", justifyContent: "center" }}>
      <FlatList
        horizontal
        scrollEnabled={true}
        showsHorizontalScrollIndicator={false}
        data={finalData}
        keyExtractor={(item) => `${item.id}`}
        contentContainerStyle={{ paddingBottom: SIZES.p6 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => onSelectCountry(item.countryCode)}
            style={{ flexDirection: "row", paddingVertical: 20 }}
          >
            <RateItem
              id={item.id}
              fromRate={item.fromRate}
              fromCurrency={item.fromCurrency}
              toRate={item.toRate}
              toCurrency={item.toCurrency}
              countryCode={item.countryCode}
              countryflag={item.countryflag}
              columnIndex={index}
              totalColumns={finalData.length}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default RateCard;
