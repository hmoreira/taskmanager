import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LanguageSwitcherProps {
  style?: any;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ style }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.languageButton,
          language === 'en' && styles.activeButton
        ]}
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.languageText,
          language === 'en' && styles.activeText
        ]}>
          EN
        </Text>
      </TouchableOpacity>
      
      <View style={styles.separator} />
      
      <TouchableOpacity
        style={[
          styles.languageButton,
          language === 'pt' && styles.activeButton
        ]}
        onPress={() => setLanguage('pt')}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.languageText,
          language === 'pt' && styles.activeText
        ]}>
          PT
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  activeText: {
    color: '#fff',
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: '#e9ecef',
    marginHorizontal: 4,
  },
});