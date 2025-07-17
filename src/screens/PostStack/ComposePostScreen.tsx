import React, {useState} from 'react';
import {FlatList, Image, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import HeaderBar from './components/HeaderBar';
import PostComposer from './components/PostComposer';
import ShowHideModal from './components/ShowHideModal';
import {myConsole} from '../../utils/myConsole';

const ComposePostScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const route = useRoute();
  const {media = []} = route.params || {};
  return (
    <View style={{flex: 1}}>
      <HeaderBar
        title="New post"
        leftIcon={require('../../assets/icons/back.png')}
        onLeftPress={() => navigation.goBack()}
      />
      <FlatList
        data={media}
        horizontal
        keyExtractor={item => item.uri}
        renderItem={({item}) => (
          <Image
            source={{uri: item.uri}}
            style={{width: 200, height: 200, margin: 8, borderRadius: 8}}
          />
        )}
        contentContainerStyle={{paddingVertical: 10}}
      />

      <PostComposer onShowHidePress={() => setModalVisible(true)} />
      <ShowHideModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};
export default ComposePostScreen;
