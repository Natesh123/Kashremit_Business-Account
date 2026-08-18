import { View } from "react-native"
import COLORS from "../../constants/Colors";

interface IProps {
    dashLength: number ;
    dashThickness?: number|1;
}

 const Dash = ({ dashLength, dashThickness }:IProps) => {
    return(
       <View style={{
          borderStyle: 'dashed',
          height:dashLength,
          borderWidth: 3,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: 'transparent',
          borderLeftColor: COLORS.gray10,
         }}/>
  
     )
  };

  export default Dash; 