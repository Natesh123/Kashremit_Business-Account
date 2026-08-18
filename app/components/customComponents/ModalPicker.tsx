import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    StyleSheet,
    Image,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { theme } from '../../core/theme';
import { FONTS } from '../../constants/Assets';

type Props = {
    label?: string;
    selectedValue?: string;
    onValueChange: (itemValue: string, itemIndex: number) => void;
    dataList: { dataValue: string; displayvalue: string; flag?: string | null }[];
    errorText?: string;
    placeholder?: string;
    disabled?: boolean;
    enabled?: boolean;
    required?: boolean;
    modalTitle?: string;
    style?: any;
    searchable?: boolean;
};

const ModalPicker = memo(({
    label,
    selectedValue,
    onValueChange,
    dataList = [],
    errorText,
    placeholder = "Select Option",
    disabled,
    enabled,
    required,
    modalTitle = "Select Option",
    style,
    searchable,
}: Props) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const isSearchable = searchable ?? dataList.length > 5;
    
    const filteredDataList = dataList.filter(item =>
        item.displayvalue.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isPickerDisabled = disabled ?? (enabled !== undefined ? !enabled : false);
    const selectedItem = dataList.find(item => item.dataValue === selectedValue);

    const handleSelect = useCallback((value: string) => {
        setModalVisible(false);
        setSearchQuery('');
        // Delay parent state updates until after modal closes to prevent iOS touch freeze
        setTimeout(() => {
            const index = dataList.findIndex(item => item.dataValue === value);
            onValueChange(value, index);
        }, 300);
    }, [dataList, onValueChange]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.itemRow}
            onPress={() => handleSelect(item.dataValue)}
        >
            <View style={styles.itemContent}>
                {item.flag && (
                    <Image source={{ uri: item.flag }} style={styles.itemFlag} />
                )}
                <Text style={[
                    styles.itemText,
                    selectedValue === item.dataValue && styles.selectedItemText
                ]}>
                    {item.displayvalue}
                </Text>
            </View>
            {selectedValue === item.dataValue && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
            )}
        </TouchableOpacity>
    ), [selectedValue, handleSelect]);

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={styles.label}>
                    {label}{' '}
                    {required && <Text style={{ color: "red" }}>*</Text>}
                </Text>
            )}
            <TouchableOpacity
                style={[
                    styles.inputContainer,
                    errorText ? styles.inputError : null,
                    isPickerDisabled ? styles.disabledInput : null
                ]}
                onPress={() => !isPickerDisabled && setModalVisible(true)}
                disabled={isPickerDisabled}
            >
                <View style={styles.selectedContent}>
                    <View style={styles.pillContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {selectedItem?.flag && (
                                <Image source={{ uri: selectedItem.flag }} style={styles.flagIcon} />
                            )}
                            <Text style={[styles.selectedText, !selectedItem && styles.placeholderText]}>
                                {selectedItem ? selectedItem.displayvalue : placeholder}
                            </Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color="#666" style={{ marginLeft: 5 }} />
                    </View>
                </View>
            </TouchableOpacity>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => { setModalVisible(false); setSearchQuery(''); }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); setSearchQuery(''); }}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {isSearchable && (
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholderTextColor="#999"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color="#999" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <ScrollView
                            keyboardShouldPersistTaps="always"
                            showsVerticalScrollIndicator={false}
                        >
                            {filteredDataList && filteredDataList.length > 0 ? (
                                filteredDataList.map((item, index) => (
                                    <TouchableOpacity
                                        key={`${item.dataValue}-${index}`}
                                        style={styles.itemRow}
                                        onPress={() => handleSelect(item.dataValue)}
                                    >
                                        <View style={styles.itemContent}>
                                            {item.flag && (
                                                <Image source={{ uri: item.flag }} style={styles.itemFlag} />
                                            )}
                                            <Text style={[
                                                styles.itemText,
                                                selectedValue === item.dataValue && styles.selectedItemText
                                            ]}>
                                                {item.displayvalue}
                                            </Text>
                                        </View>
                                        {selectedValue === item.dataValue && (
                                            <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.noResults}>
                                    <Text style={styles.noResultsText}>No results found</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 5,
        width: '100%',
    },
    label: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
        letterSpacing: 0.3,
        marginLeft: 4,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    disabledInput: {
        opacity: 0.7,
    },
    selectedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        width: '100%',
    },
    pillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    flagIcon: {
        width: 20,
        height: 14,
        borderRadius: 2,
        marginRight: 8,
    },
    selectedText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
        fontFamily: FONTS.regular,
    },
    placeholderText: {
        color: '#666',
    },
    errorText: {
        fontSize: 12,
        color: theme.colors.error,
        marginTop: 4,
        fontFamily: FONTS.regular,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalContent: {
        width: "100%",
        maxHeight: "85%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        paddingTop: 15,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#316b83",
        marginHorizontal: -20,
        marginTop: -15,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        fontFamily: FONTS.regular,
        color: "#fff",
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 15,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: '#333',
        fontFamily: FONTS.regular,
        fontSize: 14,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
    },
    itemContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    itemFlag: {
        width: 40,
        height: 30,
        borderRadius: 4,
        marginRight: 15,
    },
    itemText: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: "#333",
        fontWeight: '500',
    },
    selectedItemText: {
        color: "#316b83",
        fontWeight: "600",
    },
    noResults: {
        padding: 30,
        alignItems: "center",
    },
    noResultsText: {
        color: "#999",
        fontFamily: FONTS.regular,
        fontSize: 14,
    },
});

export default ModalPicker;
