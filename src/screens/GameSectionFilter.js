
 import React from 'react';
 import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   ScrollView,
 } from 'react-native';

 const GameSectionFilter = ({ sections, selectedSection, onSectionChange }) => {
   const sectionColors = {
     'all': '#3aed76',
     'survival': '#10B981',
     'lifesteal': '#EF4444',
     'creative': '#3B82F6',
     'pvp': '#F59E0B',
     'skyblock': '#8B5CF6',
     'prison': '#6B7280',
   };

   return (
     <View style={styles.container}>
       <ScrollView
         horizontal
         showsHorizontalScrollIndicator={false}
         contentContainerStyle={styles.scrollContainer}
       >
         <TouchableOpacity
           style={[
             styles.sectionButton,
             selectedSection === 'all' && styles.selectedButton,
             { backgroundColor: selectedSection === 'all' ? sectionColors.all : 'transparent' }
           ]}
           onPress={() => onSectionChange('all')}
         >
           <Text style={[
             styles.sectionText,
             selectedSection === 'all' && styles.selectedText
           ]}>
             All Games
           </Text>
         </TouchableOpacity>

         {sections.map((section) => (
           <TouchableOpacity
             key={section}
             style={[
               styles.sectionButton,
               selectedSection === section && styles.selectedButton,
               {
                 backgroundColor: selectedSection === section
                   ? sectionColors[section.toLowerCase()] || '#3aed76'
                   : 'transparent'
               }
             ]}
             onPress={() => onSectionChange(section)}
           >
             <Text style={[
               styles.sectionText,
               selectedSection === section && styles.selectedText
             ]}>
               {section.charAt(0).toUpperCase() + section.slice(1)}
             </Text>
           </TouchableOpacity>
         ))}
       </ScrollView>
     </View>
   );
 };

 const styles = StyleSheet.create({
   container: {
     paddingVertical: 16,
     paddingHorizontal: 16,
   },
   scrollContainer: {
     paddingHorizontal: 8,
   },
   sectionButton: {
     paddingHorizontal: 20,
     paddingVertical: 12,
     borderRadius: 25,
     marginHorizontal: 6,
     borderWidth: 1,
     borderColor: '#3aed76',
     minWidth: 80,
     alignItems: 'center',
   },
   selectedButton: {
     elevation: 3,
   },
   sectionText: {
     fontSize: 14,
     fontWeight: '600',
     color: '#3aed76',
   },
   selectedText: {
     color: '#0a0a0a',
     fontWeight: '700',
   },
 });

 export default GameSectionFilter;