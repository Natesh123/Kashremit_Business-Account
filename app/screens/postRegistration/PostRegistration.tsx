import React, { useEffect, useState } from "react";
import { Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";

import { theme } from '../../core/theme';
import Container from "../../theme/Container";
import styles from "../../styles";
import { emailValidator, passwordValidator } from "../../core/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { authenticate, GetCountryList, GetNationality, GetRemitterProfile, RemitterPostRegistration } from "app/http-services";
import { useRecoilState } from "recoil";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { ProfileState } from "app/atoms";
import Toast from "react-native-toast-message";
import Spinner from "react-native-loading-spinner-overlay";
import Button from "app/components/controls/Button";
import { Ionicons } from "@expo/vector-icons";
import ModalPicker from "app/components/customComponents/ModalPicker";
import { TDropDown } from "types";
import RmDatePicker from "app/components/controls/RmDatePicker";
import moment from 'moment';
import ModalHeaderBack from "app/components/ModalHeaderBack";
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import OWDatePicker from "app/components/customComponents/datePicker/OWDatePicker";
import DateTimePicker from "@react-native-community/datetimepicker";

const PostRegistration = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { width } = useWindowDimensions();
    const [profileItems, setProfileItems] = useRecoilState(ProfileState);
    const [profile, setProfile] = useState<any>('');
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState<any>({ value: 'Mr', error: '' });
    const [firstName, setFirstName] = useState({ value: '', error: '' });
    const [lastName, setLastName] = useState({ value: '', error: '' });
    const [email, setEmail] = useState({ value: profileItems.email, error: '' });
    const [mobile, setMobile] = useState({ value: profileItems.mobileNo, error: '' });
    const [gender, setGender] = useState<any>({ value: 'M', error: '' });
    const [dateOfBirth, setDateOfBirth] = useState({ value: new Date(), error: '' });
    const [nationality, setNationality] = useState<any>({ value: '', error: '' });
    const [addressLine1, setAddressLine1] = useState({ value: '', error: '' });
    const [addressLine2, setAddressLine2] = useState({ value: '', error: '' });
    const [country, setCountry] = useState<any>({ value: '', error: '' });
    const [city, setCity] = useState({ value: '', error: '' });
    const [postCode, setPostCode] = useState({ value: '', error: '' });

    const [titleList, setTitleList] = useState<TDropDown[]>([
        {
            dataValue: "Mr", displayvalue: "Mr",
            ISDCode: undefined,
            flag: undefined,
            price: undefined,
            description: undefined
        },
        {
            dataValue: "Mrs", displayvalue: "Mrs",
            ISDCode: undefined,
            flag: undefined,
            price: undefined,
            description: undefined
        },
        {
            dataValue: "Ms", displayvalue: "Ms",
            ISDCode: undefined,
            flag: undefined,
            price: undefined,
            description: undefined
        }]);

    const [genderList, setGenderList] = useState<TDropDown[]>([
        {
            dataValue: "M", displayvalue: "Male",
            ISDCode: undefined,
            flag: undefined,
            price: undefined,
            description: undefined
        },
        {
            dataValue: "F", displayvalue: "Female",
            ISDCode: undefined,
            flag: undefined,
            price: undefined,
            description: undefined
        }]);

    const [nationalityList, setNationalityList] = useState<TDropDown[]>([]);
    const [countryList, setCountryList] = useState<TDropDown[]>([]);

    const keyboardVerticalOffset = Platform.OS === 'ios' ? 80 : 0;


    useEffect(() => {
        fetchNationality(profileItems.tokenId, profileItems.remitterId);
        fetchCountryList(profileItems.tokenId, profileItems.remitterId);
        fetchRemitterProfile(profileItems.tokenId, profileItems.remitterId);

    }, [isFocused]);


    const fetchRemitterProfile = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetRemitterProfile(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    setProfile(res?.data?.Sender);
                    setTitle({ value: res?.data?.Sender?.Title, error: '' });
                    setFirstName({ value: res?.data?.Sender?.FirstName, error: '' });
                    setLastName({ value: res?.data?.Sender?.LastName, error: '' });
                    setEmail({ value: res?.data?.Sender?.Email, error: '' });
                    setMobile({ value: res?.data?.Sender?.Mobile, error: '' });
                    setGender({ value: res?.data?.Sender?.Gender, error: '' });
                    let dobDate = new Date();
                    if (res?.data?.Sender?.DOB) {
                        const cleanDate = String(res.data.Sender.DOB).replace(/\\\//g, "/");
                        const m = moment(cleanDate, [moment.ISO_8601, "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY"]);
                        if (m.isValid()) {
                            dobDate = m.toDate();
                        }
                    }
                    setDateOfBirth({ value: dobDate, error: '' });
                    setNationality({ value: res?.data?.Sender?.Nationality, error: '' });
                    setAddressLine1({ value: res?.data?.Sender?.Address1, error: '' });
                    setAddressLine2({ value: res?.data?.Sender?.Address2, error: '' });
                    setCountry({ value: res?.data?.Sender?.Country, error: '' });
                    setCity({ value: res?.data?.Sender?.City, error: '' });
                    setPostCode({ value: res?.data?.Sender?.PostCode, error: '' });
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

    const fetchNationality = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetNationality(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    if (res?.data?.StatusCode === 'ER0000') {
                        const _NationalityList = res?.data?.Nationality.map((data: any) => {
                            return {
                                dataValue: data.Alpha_3_Code,
                                displayvalue: data.Nationalityy,
                            }
                        });

                        setNationalityList(_NationalityList)
                        setNationality({ value: _NationalityList[0].dataValue, error: '' });

                    }
                }
            })
                .catch((err) => {
                    console.error('GetNationality', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error nationality:', error);
        }
    };

    const fetchCountryList = async (tokenId: string, remitterId: string) => {
        try {
            setLoading(true);
            const response = GetCountryList(tokenId);
            response.then((res: any) => {
                if (res.status === 200) {
                    if (res?.data?.StatusCode === 'ER0000') {
                        const _CountryList = res?.data?.CountryDetail.map((data: any) => {
                            return {
                                dataValue: data.Alpha_3_Code,
                                displayvalue: data.CountryName,
                            }
                        });
                        setCountryList(_CountryList)
                        setCountry({ value: _CountryList[0].dataValue, error: '' });
                    }
                }
            })
                .catch((err) => {
                    console.error('GetCountryList', err.response?.data?.message)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error('Error country list:', error);
        }
    };

    const _onUpdatePressed = async () => {
        setLoading(true)
        const postData: any = {
            tokenId: profileItems.tokenId,
            remitterId: profileItems.remitterId,
            addressLine1: addressLine1.value,
            addressLine2: addressLine2.value,
            city: city.value,
            country: country.value,
            countryName: '',
            postCode: postCode.value,
            dateOfBirth: '2024-09-17',
            email: email.value,
            title: title.value,
            firstName: firstName.value,
            lastName: lastName.value,
            gender: gender.value,
            mobile: mobile.value,
            nationality: nationality.value,
        };
        const response = RemitterPostRegistration(postData);
        response.then((res: any) => {
            if (res.status === 200) {
                if (res.data.StatusCode === "ER0000") {
                    Toast.show({
                        type: 'success',
                        text1: 'Post registration',
                        text2: res.data.StatusMsg
                    });
                    setProfileItems({
                        remitterId: profileItems.remitterId,
                        firstName: firstName.value,
                        lastName: lastName.value,
                        email: email.value,
                        mobileNo: mobile.value,
                        tokenId: profileItems.tokenId,
                    });
                    navigation.navigate('Root');

                } else {
                    Toast.show({
                        type: 'error',
                        text1: 'Post registration',
                        text2: res.data.StatusMsg
                    });
                }
            }
        })
            .catch((err: any) => {
                Toast.show({
                    type: 'error',
                    text1: 'Login',
                    text2: err
                });
            })
            .finally(() => setLoading(false));
    }

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    const showDatePicker = () => {
        setDatePickerVisible(true);
        setSelectedDate(dateOfBirth.value);
    };

    const hideDatePicker = () => {
        setDatePickerVisible(false);
    };

    const handleConfirm = (date: Date) => {
        setDateOfBirth({ value: date, error: '' });
        setDatePickerVisible(false);
    };

    return (
        <SafeAreaView style={[styles.container, { flex: 1, backgroundColor: '#316b83', marginTop: 0 }]}>
            <ModalHeaderBack title="Post Registration" />
            <Container style={{ backgroundColor: '#f9f9f9', flex: 1 }}>
                <ScrollView style={{ width: "100%", padding: 10, marginBottom: 70 }} showsVerticalScrollIndicator={false}
                >
                    <View>
                        <View >
                            <Text style={styles.header}>Your Personal Details</Text>
                        </View>
                        <View >
                            <ModalPicker
                                label="Title"
                                modalTitle="Select Title"
                                placeholder="Select Title"
                                dataList={titleList}
                                style={{ width: '100%', marginBottom: 15 }}
                                selectedValue={title.value}
                                onValueChange={(itemValue) =>
                                    setTitle({ value: itemValue, error: '' })
                                }
                            />
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    First name
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={firstName.value}
                                        onChangeText={(text: any) => setFirstName({ value: text, error: '' })}

                                    />
                                </View>
                                {firstName.error ? <Text style={styles.error}>{firstName.error}</Text> : null}
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    Last name
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={lastName.value}
                                        onChangeText={(text: any) => setLastName({ value: text, error: '' })}

                                    />
                                </View>
                                {lastName.error ? <Text style={styles.error}>{lastName.error}</Text> : null}
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    Email id
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={email.value}
                                        onChangeText={(text: any) => setEmail({ value: text, error: '' })}
                                        editable={false}
                                    />
                                </View>
                                {email.error ? <Text style={styles.error}>{email.error}</Text> : null}
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    Mobile
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={mobile.value}
                                        onChangeText={(text: any) => setMobile({ value: text, error: '' })}
                                        editable={false}
                                    />
                                </View>
                                {mobile.error ? <Text style={styles.error}>{mobile.error}</Text> : null}
                            </View>

                            <ModalPicker
                                label="Gender"
                                modalTitle="Select Gender"
                                placeholder="Select Gender"
                                dataList={genderList}
                                style={{ width: '100%', marginBottom: 15 }}
                                selectedValue={gender.value}
                                onValueChange={(itemValue) =>
                                    setGender({ value: itemValue, error: '' })
                                }
                            />

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Date of Birth</Text>
                                <TouchableOpacity
                                    onPress={() => setShowPicker(true)}
                                    style={styles.inputControls}
                                >
                                    <Text>{dateOfBirth.value.toLocaleDateString()}</Text>
                                </TouchableOpacity>

                                {showPicker && (
                                    <DateTimePicker
                                        value={dateOfBirth.value}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            setShowPicker(false);
                                            if (selectedDate) {
                                                const age = moment().diff(selectedDate, 'years');
                                                if (age < 15) {
                                                    setDateOfBirth({ value: selectedDate, error: 'You must be at least 15 years old' });
                                                } else {
                                                    setDateOfBirth({ value: selectedDate, error: '' });
                                                }
                                            }
                                        }}
                                    />
                                )}
                                {dateOfBirth.error ? <Text style={styles.error}>{dateOfBirth.error}</Text> : null}
                            </View>

                            <ModalPicker
                                label="Nationality"
                                modalTitle="Select Nationality"
                                placeholder="Select Nationality"
                                dataList={nationalityList}
                                style={{ width: '100%', marginBottom: 15 }}
                                selectedValue={nationality.value}
                                onValueChange={(itemValue) =>
                                    setNationality({ value: itemValue, error: '' })
                                }
                            />

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    Address line 1
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={addressLine1.value}
                                        onChangeText={(text: any) => setAddressLine1({ value: text, error: '' })}

                                    />
                                </View>
                                {addressLine1.error ? <Text style={styles.error}>{addressLine1.error}</Text> : null}
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    Address line 2
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={addressLine2.value}
                                        onChangeText={(text: any) => setAddressLine2({ value: text, error: '' })}

                                    />
                                </View>
                                {addressLine2.error ? <Text style={styles.error}>{addressLine2.error}</Text> : null}
                            </View>
                            <ModalPicker
                                label="Country"
                                modalTitle="Select Country"
                                placeholder="Select Country"
                                dataList={countryList}
                                style={{ width: '100%', marginBottom: 15 }}
                                selectedValue={country.value}
                                onValueChange={(itemValue) =>
                                    setCountry({ value: itemValue, error: '' })
                                }
                            />

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    City
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={city.value}
                                        onChangeText={(text: any) => setCity({ value: text, error: '' })}

                                    />
                                </View>
                                {city.error ? <Text style={styles.error}>{city.error}</Text> : null}
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>
                                    Post code
                                </Text>
                                <View style={styles.inputControls}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        value={postCode.value}
                                        onChangeText={(text: any) => setPostCode({ value: text, error: '' })}
                                    />
                                </View>
                                {postCode.error ? <Text style={styles.error}>{postCode.error}</Text> : null}
                            </View>


                        </View>
                    </View>
                </ScrollView>
                {loading && <Spinner
                    visible={true}
                    size='large'
                    animation='slide'
                />}
            </Container>

            {/* <View style={styles.rightSide}>
                                <View style={{ flexDirection: 'row', }}>
                                    <Button style={{ margin: 5 }} outerLine={true} onPress={() => navigation.navigate('Root')}>
                                        Cancel
                                    </Button>

                                    <Button style={{ margin: 5 }} onPress={_onUpdatePressed}>
                                        Update
                                    </Button>
                                </View>
                            </View> */}


            {/* Update Button */}
            {/* <TouchableOpacity
      style={{
        backgroundColor: '#316b83',
        borderRadius: 6,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        width: 180, // increased width
        margin: 5
      }}
      onPress={_onUpdatePressed}
    >
      <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
        Update
      </Text>
    </TouchableOpacity> */}


            <View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingHorizontal: 16,
                    paddingBottom: 12,

                }}
            >


                <TouchableOpacity

                    style={{
                        backgroundColor: "#316b83",
                        borderRadius: 6,
                        height: 50,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    onPress={_onUpdatePressed}
                >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                        Update
                    </Text>
                </TouchableOpacity>

            </View>





        </SafeAreaView>
    );
};

export default PostRegistration;
