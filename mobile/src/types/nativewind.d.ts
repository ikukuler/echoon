/// <reference types="nativewind/types" />

import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  
  interface TextProps {
    className?: string;
  }
  
  interface TouchableOpacityProps {
    className?: string;
  }
  
  interface ScrollViewProps {
    className?: string;
  }
  
  interface ImageProps {
    className?: string;
  }
}

// React 19 compatibility
declare module 'react' {
  interface ReactNode {}
}
