import { View, Text, TextInput } from "react-native";
import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import { FONTS, SIZES } from "../../../../constants/Assets";
import styles from "../../../../styles";
import { ProfileState } from "../../../../atoms";
import { useNavigation } from "@react-navigation/native";
import { PrefercountryModel } from "app/models/prefercountry-model";
import Vector from "app/assets/vectors";
import { theme } from '../../../../core/theme';
import CountryFlag from "react-native-country-flag";
type Props = PrefercountryModel;
import { Image, useWindowDimensions } from "react-native";

const TransactionalPreferencesItems = ({ amount, count, country, countryName, reason, status, onPress, columnIndex, totalColumns }: Props) => {
    const getCountryISO2 = require("country-iso-3-to-2");
    const currentToken = useRecoilValue(ProfileState);
    const [loading, setLoading] = useState(false);
    const isFirst = columnIndex === 0;
    const isLast = columnIndex === totalColumns - 1;
    const { width } = useWindowDimensions();
    const onEditPreferences = async () => {
        setLoading(true)
        onPress({
            amount: amount, count: count, country: country, countryName: countryName, reason: reason
        })
        setLoading(false)
    }
    return (
        <View style={[styles.cardMainWrapper,{ borderRadius:14, paddingHorizontal:15, paddingVertical:10, marginLeft: isFirst ? 20 : 10, marginRight: isLast ? 20 : 0, width: (width * 0.50)-25, height:'100%', justifyContent:'space-between'}]}>
            <View
                style={{
                    justifyContent: "flex-start",
                }}>
                <View style={{
                    flexDirection: "row",
                    justifyContent: "flex-start", 
                }}>
                    <View
                        style={{
                            width: 40,
                            height: 25,
                        }}>
                        <CountryFlag isoCode={getCountryISO2(country) || ""} size={20} />
                    </View>
                    <Text numberOfLines={2} style={{ color: theme.colors.text, flexWrap: "wrap", fontFamily: FONTS.semibold }}>
                        {countryName}
                    </Text>

                    {status !== 'P' && <Vector
                        as="materialcommunityicons"
                        name="pencil-outline"
                        size={24}
                        color={theme.colors.primary}
                        onPress={onEditPreferences}
                        style={{ marginLeft: 5 }}
                    />}
                </View>
            </View>

            <View
                style={{
                    justifyContent: "flex-start",
                    padding: 5
                }}>
                <Text numberOfLines={2} style={{ color: theme.colors.black50, flexWrap: "wrap", fontFamily: FONTS.medium }}>
                    {reason}
                </Text>
            </View>
            <View
                style={{
                    justifyContent: "flex-start",
                    padding: 5
                }}>
                <Text numberOfLines={2} style={{ color: theme.colors.black50, flexWrap: "wrap", fontFamily: FONTS.medium }}>
                    {amount}
                </Text>
            </View>
            <View style={{
                justifyContent: "flex-start",
                padding: 5
            }}>
                <Text style={{ color: theme.colors.black50, fontSize: SIZES.medium, fontFamily: FONTS.semibold }}>
                    {count} Transactions per month
                </Text>
            </View>
        </View>
    );
};

export default TransactionalPreferencesItems;
