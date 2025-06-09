import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import RelativesTree from 'react-native-relatives-tree';
import HierarchyHeader from './components/HierarchyHeader';
import {color} from '../../const/color';

const relatives = [
  {
    name: 'John',
    relation: 'Grandfather',
    spouse: {name: 'Anne', dob: '04/05/2007'},
    dob: '01/05/2004',
    children: [
      {
        name: 'Dan',
        relation: 'Father',
        spouse: {name: 'Ella', dob: '04/05/2007', relation: 'Mother'},
        dob: '01/05/2004',
        children: [
          {name: 'Olivia', relation: 'Daughter', dob: '01/05/2004'},
          {name: 'Mary', relation: 'Daughter', dob: '01/05/2004'},
        ],
      },
      {
        name: 'Jack',
        relation: 'Uncle',
        spouse: {name: 'Rachel', dob: '04/05/2007'},
        dob: '01/05/2004',
        dod: '03/03/2017',
      },
    ],
  },
];

const RelativeItem = ({level, info, style, matchedName}: any) => {
  const isMatch =
    matchedName && info.name.toLowerCase() === matchedName.toLowerCase();

  return (
    <TouchableOpacity
      style={[
        styles.item,
        style,
        isMatch && {backgroundColor: '#ffa'}, // highlight match
      ]}
      onPress={() =>
        Alert.alert(
          'Person Clicked',
          `${info.name} (${info.relation || 'N/A'})`,
        )
      }>
      <Text>{info.name}</Text>
      <Text style={{fontSize: 12}}>{info.relation || '....'}</Text>
      <Text style={{fontSize: 12}}>({level})</Text>
    </TouchableOpacity>
  );
};

const Hierarchy = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  const searchTree = (nodes: any[]): boolean => {
    for (const node of nodes) {
      if (node.name.toLowerCase() === searchQuery.toLowerCase()) {
        setMatchedName(node.name);
        return true;
      }
      if (
        node.spouse &&
        node.spouse.name?.toLowerCase() === searchQuery.toLowerCase()
      ) {
        setMatchedName(node.spouse.name);
        return true;
      }
      if (node.children && searchTree(node.children)) return true;
    }
    return false;
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setMatchedName(null);
      setSearchResult(null);
      return;
    }
    const found = searchTree(relatives);
    setSearchResult(found ? 'Found' : 'Not found');
    if (!found) setMatchedName(null);
  };

  return (
    <SafeAreaView style={styles.main}>
      <HierarchyHeader />

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search by name..."
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          placeholderTextColor={'grey'}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          <Text style={{color: '#fff'}}>Search</Text>
        </TouchableOpacity>
      </View>

      {searchResult && (
        <Text style={styles.status}>
          {searchResult === 'Found'
            ? '✅ Person found and highlighted'
            : '❌ Not found'}
        </Text>
      )}

      <RelativesTree
        data={relatives}
        spouseKey="spouse"
        cardWidth={80}
        gap={10}
        relativeItem={(props: any) => (
          <RelativeItem {...props} matchedName={matchedName} />
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  item: {
    height: 80,
    width: 80,
    backgroundColor: `${color.mainColor}90`,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    margin: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchBtn: {
    backgroundColor: '#4a5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  status: {
    marginHorizontal: 10,
    marginBottom: 5,
    fontSize: 14,
    color: '#555',
  },
});

export default Hierarchy;
