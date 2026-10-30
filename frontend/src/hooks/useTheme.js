import { useTheme as useThemeFromContext } from '../context/ThemeContext';

export const useTheme = () => {
  return useThemeFromContext();
};

export default useTheme;

