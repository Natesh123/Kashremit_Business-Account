import {
  View,
  useWindowDimensions,
  ImageURISource,
  StyleSheet,
  ViewStyle
} from 'react-native';
import React from 'react';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { FONTS } from '../../../constants/Assets';

type Props = {
  item: { text: string; description: string; image: ImageURISource };
  index: number;
  x: Animated.SharedValue<number>;
  style?: ViewStyle;
};

const ListItem = ({ item, index, x, style }: Props) => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const imageSize = SCREEN_WIDTH * 0.45;
  const containerSize = SCREEN_WIDTH * 0.55;

  const rnImageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [100, 0, 100],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      width: imageSize,
      height: imageSize,
      transform: [{ translateY }],
    };
  }, [index, x]);

  const rnTextStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [100, 0, 100],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      x.value,
      [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ translateY }],
    };
  }, [index, x]);

  return (
    <View style={[styles.itemContainer, style, { width: SCREEN_WIDTH }]}>
      {/* Image Container */}
      <View
        style={{
          height: containerSize,
          width: containerSize,
          backgroundColor: '#fff',
          borderRadius: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.05,
          shadowRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SCREEN_HEIGHT * 0.03,
          padding: 15
        }}
      >
        <Animated.Image
          source={item.image}
          style={rnImageStyle}
          resizeMode="contain"
        />
      </View>

      {/* Text Section */}
      <View style={{ alignItems: "center", paddingHorizontal: 20, width: '100%' }}>
        <Animated.Text
          style={[
            styles.textItem,
            rnTextStyle,
            {
              fontSize: 16,
              fontFamily: "FONTS.semiBold",
              lineHeight: SCREEN_WIDTH * 0.075,
            }
          ]}
          numberOfLines={2}
        >
          {item.text}
        </Animated.Text>
        <View style={{ width: SCREEN_WIDTH * 0.9 }}>
          <Animated.Text
            style={[
              styles.textDescription,
              rnTextStyle,
              {
                fontSize: 14,
                fontFamily: "FONTS.regular",
                lineHeight: SCREEN_WIDTH * 0.055,
              }
            ]}
            numberOfLines={0}
            adjustsFontSizeToFit={false}
          >
            {item.description}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
};

export default React.memo(ListItem);

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  textItem: {
    color: "#000",
    fontFamily: FONTS.semibold,
    textAlign: 'center',
    width: '100%',
    flexWrap: 'wrap',
  },
  textDescription: {
    color: "#000",
    marginVertical: 15,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    flexWrap: 'wrap',
    width: '100%',
    includeFontPadding: false,
  },
});
