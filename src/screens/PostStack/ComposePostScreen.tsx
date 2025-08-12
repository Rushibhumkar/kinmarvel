import React, {useState} from 'react';
import {FlatList, Image, TextInput, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import HeaderBar from './components/HeaderBar';
import PostComposer from './components/PostComposer';
import ShowHideModal from './components/ShowHideModal';
import CustomText from '../../components/CustomText';
import {color} from '../../const/color';
import {homeRoute} from '../AuthScreens/routeName';
import {showErrorToast, showSuccessToast} from '../../utils/toastModalFunction';
import {createPost} from '../../api/posts/postFunc';
import mime from 'mime';
import {myConsole} from '../../utils/myConsole';
import {pickFileHelper} from '../ChatScreens/components/pickFileHelper';
import useLocationPermission from '../../hooks/useLocationPermission';
import CustomBottomModal from '../../components/CustomBottomModal';

const ComposePostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {media: routeMedia = []}: any = route.params || {};

  const [modalVisible, setModalVisible] = useState(false);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState(routeMedia);
  const [visibility, setVisibility] = useState<'self' | 'public' | 'followers'>(
    'followers',
  );
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchText, setSearchText] = useState('');
  const {location, requestLocationPermission} = useLocationPermission();

  const handlePickFile = () => {
    pickFileHelper({
      onStartUpload: () => console.log('Uploading file...'),
      onFinishUpload: () => console.log('File upload finished'),
      onSuccess: fileData => {
        myConsole('Picked & uploaded file data:', fileData);
        setMedia((prev: any) => [...prev, fileData]);
      },
    });
  };

  const handleCreatePost = async () => {
    try {
      setLoading(true);

      const files = media.map((item: any) => ({
        uri: item.uri,
        type: mime.getType(item.uri) || 'image/jpeg',
        name: item.uri.split('/').pop() || `file-${Date.now()}.jpg`,
      }));

      const postData = {
        type: 'post' as const,
        desc: caption,
        location: selectedLocation,
        files,
        visible_to: visibility,
      };

      myConsole('Creating post with data:', JSON.stringify(postData, null, 2));

      const response = await createPost(postData);

      myConsole('Create post API response:', JSON.stringify(response, null, 2));

      showSuccessToast({description: 'Post added successfully'});
      navigation.navigate('HomeStack', {screen: homeRoute.AllStories});
    } catch (err) {
      console.error(err);
      showErrorToast({description: 'Failed to create post'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{flex: 1}}>
      <HeaderBar
        title="Add post"
        leftIcon={require('../../assets/icons/back.png')}
        onLeftPress={() => navigation.goBack()}
      />

      {/* File picker button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#ddd',
          padding: 10,
          borderRadius: 8,
          alignSelf: 'center',
          marginVertical: 10,
        }}
        onPress={handlePickFile}>
        <CustomText>Add Media</CustomText>
      </TouchableOpacity>

      {/* Media Preview */}
      <FlatList
        data={media}
        horizontal
        keyExtractor={(item, index) => item.uri + index}
        renderItem={({item}) => (
          <Image
            source={{uri: item.uri}}
            style={{width: 200, height: 200, margin: 8, borderRadius: 8}}
          />
        )}
        contentContainerStyle={{paddingVertical: 10}}
      />

      <PostComposer
        onShowHidePress={() => setModalVisible(true)}
        caption={caption}
        onLocationPress={() => {
          requestLocationPermission();
          setLocationModalVisible(true);
        }}
        setCaption={setCaption}
        visibility={visibility}
      />

      <ShowHideModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={option => {
          setVisibility(
            option.toLowerCase() as 'self' | 'public' | 'followers',
          );
          setModalVisible(false);
        }}
      />

      <TouchableOpacity
        style={{
          marginBottom: 12,
          alignSelf: 'center',
          backgroundColor: color.mainColor,
          paddingHorizontal: 52,
          paddingVertical: 14,
          borderRadius: 12,
        }}
        activeOpacity={0.6}
        onPress={handleCreatePost}>
        <CustomText style={{color: '#fff', fontWeight: '600'}}>
          {loading ? 'Posting...' : 'Post'}
        </CustomText>
      </TouchableOpacity>

      <CustomBottomModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        modalHeight={500}>
        {/* Search bar */}
        <TextInput
          placeholder="Search location..."
          value={searchText}
          onChangeText={setSearchText}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 8,
            marginBottom: 12,
          }}
        />

        {/* Location list — replace with your search results */}
        {/* <RNFlatList
    data={[
      {name: 'Punya Nagari', address: 'Pune', latitude: '12.32345', longitude: '12.32345'},
      {name: 'MG Road', address: 'Pune', latitude: '12.33456', longitude: '12.33456'},
    ].filter(l => l.name.toLowerCase().includes(searchText.toLowerCase()))}
    keyExtractor={(item, index) => index.toString()}
    renderItem={({item}) => (
      <TouchableOpacity
        style={{paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee'}}
        onPress={() => setSelectedLocation(item)}
      >
        <CustomText>{item.name}</CustomText>
        <CustomText style={{color: 'grey', fontSize: 12}}>{item.address}</CustomText>
      </TouchableOpacity>
    )}
  /> */}

        {/* Confirm button */}
        <TouchableOpacity
          style={{
            marginTop: 16,
            backgroundColor: color.mainColor,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setLocationModalVisible(false)}>
          <CustomText style={{color: '#fff'}}>Select Location</CustomText>
        </TouchableOpacity>
      </CustomBottomModal>
    </View>
  );
};

export default ComposePostScreen;
