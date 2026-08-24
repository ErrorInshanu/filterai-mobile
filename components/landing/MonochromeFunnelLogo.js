import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

export default function MonochromeFunnelLogo({ size = 96 }) {
  return (
    <View style={[styles.squircleContainer, { width: size, height: size }]}>
      <Svg width={size * 0.52} height={size * 0.52} viewBox="0 0 100 100" fill="none">
        <Defs>
          <SvgGradient id="screenshotFunnelGrad" x1="0" y1="0" x2="100" y2="100">
            <Stop offset="0%" stopColor="#C084FC" />
            <Stop offset="50%" stopColor="#A78BFA" />
            <Stop offset="100%" stopColor="#8B5CF6" />
          </SvgGradient>
        </Defs>

        {/* Clean Purple Funnel Icon Matching Screenshot */}
        <Path
          d="M 8 18 C 8 12, 92 12, 92 18 L 62 52 L 62 82 C 62 86, 56 90, 50 90 C 44 90, 38 86, 38 82 L 38 52 Z"
          fill="url(#screenshotFunnelGrad)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  squircleContainer: {
    borderRadius: 24,
    backgroundColor: '#12162D',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
