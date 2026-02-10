import React, { memo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SIZES } from 'app/constants/Assets';


type Props = {
  buttons: string[],
  width:number,
  onPress: ((button: string) => void),
};

const GroupButton = ({ buttons, width, onPress }: Props) => {

  const [selection, setSelection] = useState(buttons[0]);

  const _onPressed = async (selected: string) => {
    setSelection(selected);
    onPress(selected);
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.btnGroup, {padding:15, overflow:'scroll'}]}>
        {buttons?.length &&

        buttons.map((btn, index) => (
  
          <TouchableOpacity  key={index}  style={{ margin: 5, shadowColor: theme.colors.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.05, shadowRadius: 24, borderRadius:12 }} onPress={() => _onPressed(btn)}>
            <LinearGradient colors={selection === btn ? [theme.colors.buttonPrimary, theme.colors.buttonSecondary] : [theme.colors.secondary, theme.colors.secondary]}
              start={{ x: -0.1, y: 0.0 }}
              end={{ x: 1.1, y: 0.4 }}
              style={[{
                padding: 7,
                alignItems: 'center',
                borderRadius: 12,
                width: width,
              }]}>
              <Text style={[styles.text, selection === btn ? { color: theme.colors.buttonColor } : { color: theme.colors.text }]}>{btn}</Text>
            </LinearGradient>
          </TouchableOpacity>
        
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: "center",
  },
  btn: {
    borderColor: '#6B7280',
    margin: 10
  },
  btnText: {
    textAlign: 'center',
    paddingVertical: 7,
    paddingHorizontal: 7,
    width: 200,
    alignSelf: 'center',
    fontFamily: FONTS.regular,
    fontSize: SIZES.small
  },
  button: {
    marginVertical: 10,
    marginHorizontal: 20,
    padding: 0,
  },
  text: {
    fontFamily: FONTS.semibold,
    fontSize: SIZES.medium,
    textAlign: 'center',

  },
});
export default memo(GroupButton);