import React, { useState, useCallback, memo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    FlatList,
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
}: Props) => {
    const [modalVisible, setModalVisible] = useState(false);

    const isPickerDisabled = disabled ?? (enabled !== undefined ? !enabled : false);
    const selectedItem = dataList.find(item => item.dataValue === selectedValue);

    const handleSelect = useCallback((value: string) => {
        const index = dataList.findIndex(item => item.dataValue === value);
        onValueChange(value, index);
        setModalVisible(false);
    }, [dataList, onValueChange]);

    const renderItem = useCallback(({ item }: { item: any }) => (
        <TouchableOpacity
            key={item.dataValue}
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
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{modalTitle}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={dataList}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.dataValue}
                            keyboardShouldPersistTaps="always"
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.noResults}>
                                    <Text style={styles.noResultsText}>No results found</Text>
                                </View>
                            }
                        />
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
        color: theme.colors.color,
        fontSize: 12,
        marginVertical: 5,
        fontFamily: FONTS.medium,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        backgroundColor: 'transparent',
        height: 50,
        width: '100%',
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        borderColor: '#eee',
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
        backgroundColor: '#fff',
        borderColor: '#eef0f2',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: 'space-between',
        width: '100%',
    },
    flagIcon: {
        width: 20,
        height: 14,
        borderRadius: 2,
        marginRight: 8,
    },
    selectedText: {
        fontSize: 14,
        color: '#000',
        fontFamily: "SF Pro Display",
        fontWeight: '500',
    },
    placeholderText: {
        color: '#666',
    },
    errorText: {
        fontSize: 12,
        color: theme.colors.error,
        marginTop: 4,
        fontFamily: "SF Pro Display",
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
        fontFamily: "SF Pro Display",
        color: "#fff",
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
        fontFamily: "SF Pro Display",
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
        fontFamily: "SF Pro Display",
        fontSize: 14,
    },
});

export default ModalPicker;
