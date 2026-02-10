import { View, Text, ViewStyle, ScrollView, RefreshControl, Dimensions, TextInput, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import styles from "app/styles";
import Checkbox from "../../../components/Checkbox";
import { BoldMonoText, LightMonoText, MediumMonoText, RegularText } from "app/components/StyledText";
import { GetDocument, GetGDPR, GetReferDetails, GetRemitterProfile } from "app/http-services";
import { useIsFocused } from "@react-navigation/native";
import { useRecoilValue } from "recoil";
import { ProfileState } from "app/atoms";
import { theme } from "app/core/theme";
import { dateFormat } from "app/helpers";
import moment from "moment";

type Props = {
    profile: any,
    style?: ViewStyle
};

type CheckboxRowProps = {
    status: 'checked' | 'unchecked';
    onPress: () => void;
    label: string;
};


const PersonalDetails = ({ profile, style }: Props) => {
    const isFocused = useIsFocused();
    const currentToken = useRecoilValue(ProfileState);
    const [document, setDocument] = useState(0);
    const [loading, setLoading] = useState(false);


    const [checkedTermsRemitSMS, setCheckedTermsRemitSMS] = useState('N');
    const [checkedTermsRemitEMAIL, setCheckedTermsRemitEMAIL] = useState('N');
    const [checkedTermsInsureSMS, setCheckedTermsInsureSMS] = useState('N');
    const [checkedTermsInsureEMAIL, setCheckedTermsInsureEMAIL] = useState('N');


    useEffect(() => {
        fetchGDPR(currentToken.tokenId, currentToken.remitterId);
        fetchDocument(currentToken.tokenId, currentToken.remitterId);
    }, [isFocused]);

    const fetchDocument = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetDocument(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    if (res.data.StatusCode === "ER0000") {
                        if (res?.data?.Document) {
                            setDocument((res?.data?.Document as any[]).length);
                        }
                    } else {
                        setDocument(0)
                    }
                }
            })
                .catch((err) => {
                    console.error('Fetch Remitter Document', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error Remitter profile:', error);
        }
    };

    const fetchGDPR = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetGDPR(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    setCheckedTermsRemitSMS(res?.data?.Option1)
                    setCheckedTermsRemitEMAIL(res?.data?.Consent)
                    setCheckedTermsInsureSMS(res?.data?.Option2)
                    setCheckedTermsInsureEMAIL(res?.data?.Option3)
                }
            })
                .catch((err) => {
                    console.error('Fetch Remitter profile', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error Remitter profile:', error);
        }
    };

    const CheckboxRow = ({ status, onPress, label }: CheckboxRowProps) => (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginHorizontal: 20,
                marginTop: 0,
                marginBottom: 10,
            }}
        >
            <Checkbox
                status={status}
                onPress={onPress}
            />
            <Text
                style={{
                    flexShrink: 1,
                    fontFamily: "FONTS.regular",
                    fontSize: 14,
                    flexWrap: 'wrap',
                    marginTop: 6,
                    paddingLeft: 8,
                }}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );


    return (
        <ScrollView
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <View style={style}>


                {/* <View style={{ flexDirection: 'row', margin: 20, marginTop: 0, marginBottom: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={styles.header}>Personal Details</Text>
                </View> */}
                <View style={{ paddingHorizontal: 20 }}>
                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>First Name</MediumMonoText>
                        <BoldMonoText>{profile?.FirstName}</BoldMonoText>
                    </View> */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.FirstName}

                            />
                        </View>
                    </View>


                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Last Name</MediumMonoText>
                        <BoldMonoText>{profile?.LastName}</BoldMonoText>

                    </View> */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.LastName}

                            />
                        </View>
                    </View>

                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Email</MediumMonoText>
                        <BoldMonoText>{profile?.Email}</BoldMonoText>
                    </View> */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.Email}

                            />
                        </View>
                    </View>

                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Mobile number</MediumMonoText>
                        <BoldMonoText>{profile?.Mobile}</BoldMonoText>
                    </View> */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Mobile number</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.Mobile}

                            />
                        </View>
                    </View>


                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Date of Birth</MediumMonoText>
                        <BoldMonoText>{dateFormat(profile?.DOB)}</BoldMonoText>
                    </View> */}


                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Date of Birth</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={
                                    profile?.DOB
                                        ? moment(profile.DOB, [
                                            moment.ISO_8601,
                                            "MM/DD/YYYY",
                                            "MM/DD/YYYY HH:mm:ss",
                                            "M/D/YYYY h:mm:ss A",
                                            "YYYY-MM-DD",
                                            "DD-MMM-YYYY"
                                        ]).isValid()
                                            ? moment(profile.DOB, [
                                                moment.ISO_8601,
                                                "MM/DD/YYYY",
                                                "MM/DD/YYYY HH:mm:ss",
                                                "M/D/YYYY h:mm:ss A",
                                                "YYYY-MM-DD",
                                                "DD-MMM-YYYY"
                                            ]).format('MM/DD/YYYY')
                                            : profile.DOB // Fallback to original string if parsing fails, so we see what it is instead of "Invalid Date"
                                        : ''
                                }
                            />

                        </View>
                    </View>


                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Address Line 1</MediumMonoText>
                        <BoldMonoText>{profile?.Address1}</BoldMonoText>
                    </View> */}


                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Address Line 1</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.Address1}

                            />
                        </View>
                    </View>




                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Address Line 2</MediumMonoText>
                        <BoldMonoText>{profile?.Address2}</BoldMonoText>
                    </View> */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Address Line 2</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.Address2}

                            />
                        </View>
                    </View>


                    {/* <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Country Residing</MediumMonoText>
                        <BoldMonoText>{profile?.CountryName}</BoldMonoText>
                    </View> */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Country Residing</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.CountryName}

                            />
                        </View>
                    </View>

                    {/* 
                    <View style={{ padding: 10 }}>
                        <MediumMonoText style={{ color: theme.colors.black50 }}>Post Code</MediumMonoText>
                        <BoldMonoText>{profile?.PostCode}</BoldMonoText>
                    </View> */}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Post Code</Text>
                        <View style={styles.inputControls}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                value={profile?.PostCode}

                            />
                        </View>
                    </View>



                </View>
                <View style={[style]}>
                    {/* <MediumMonoText style={styles.header}>Submitted KYC Documents</MediumMonoText> */}
                    <View style={{ flexDirection: 'row', margin: 20, marginTop: 0, marginBottom: 10, alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.header}>Submitted KYC Documents</Text>
                    </View>

                    <View style={{ flexDirection: 'row', margin: 20, marginTop: 0, marginBottom: 10, alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.header}>{document}attachments</Text>
                    </View>

                    {/* <View >
                        <BoldMonoText>{document} attachments</BoldMonoText>
                    </View> */}
                </View>
                {/* <View >
                    <MediumMonoText style={styles.header}>Consent for marketing</MediumMonoText>
                </View> */}

                <View style={{ flexDirection: 'row', margin: 20, marginTop: 0, marginBottom: 10, alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={styles.header}>Consent for marketing</Text>
                </View>
                <CheckboxRow
                    status={checkedTermsRemitSMS === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsRemitSMS(checkedTermsRemitSMS === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through SMS Remit"
                />

                <CheckboxRow
                    status={checkedTermsRemitEMAIL === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsRemitEMAIL(checkedTermsRemitEMAIL === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through Email Remit"
                />

                <CheckboxRow
                    status={checkedTermsInsureSMS === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsInsureSMS(checkedTermsInsureSMS === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through SMS from Insure"
                />

                <CheckboxRow
                    status={checkedTermsInsureEMAIL === 'Y' ? 'checked' : 'unchecked'}
                    onPress={() =>
                        setCheckedTermsInsureEMAIL(checkedTermsInsureEMAIL === 'Y' ? 'N' : 'Y')
                    }
                    label="Yes, I would like to receive offers and promotions through Email from Insure"
                />


            </View>
        </ScrollView>
    );
};

export default PersonalDetails;
