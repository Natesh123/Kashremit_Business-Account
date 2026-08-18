import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View,Text } from 'react-native';
import { Checkbox as PaperCheckbox } from 'react-native-paper';
import { theme } from '../core/theme';

type Props = React.ComponentProps<typeof PaperCheckbox>& { label?: string };;

const Checkbox = ({ onPress,label,status, testID, ...props }: Props) => (
    <TouchableOpacity onPress={onPress}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <PaperCheckbox.Android
                status={status}
                testID={testID}
                color={theme.colors.buttonPrimary}
                uncheckedColor={theme.colors.buttonPrimary}
                {...props}
            />
            <Text>{label}</Text>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    button: {
        width: '100%',
        marginVertical: 10,
        backgroundColor: theme.colors.primary
    },
    text: {
        fontWeight: 'bold',
        fontSize: 15,
        lineHeight: 26,
    },
});

export default memo(Checkbox);
