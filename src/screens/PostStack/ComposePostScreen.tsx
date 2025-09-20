import React, {useState} from 'react';
import {FlatList, Image, TouchableOpacity, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import HeaderBar from './components/HeaderBar';
import PostComposer from './components/PostComposer';
import ShowHideModal from './components/ShowHideModal';
import CustomText from '../../components/CustomText';
import {color} from '../../const/color';
import {homeRoute} from '../AuthScreens/routeName';
import {createPost} from '../../api/posts/postFunc';
import mime from 'mime';
import {myConsole} from '../../utils/myConsole';
import useLocationPermission from '../../hooks/useLocationPermission';
import LocationPickerBottomSheet from '../../components/LocationPickerBottomSheet';
import {useAppToast} from '../../components/toast/AppToast';
import TagPeopleModal from './components/TagPeopleModal';

type SelectedLocation = {
  address: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
} | null;

const ComposePostScreen = () => {
  const toast = useAppToast();
  const navigation = useNavigation();
  const route = useRoute();
  const {media: routeMedia = [] as any[]} = (route.params as any) || {};

  const [taggedUsers, setTaggedUsers] = useState<
    {_id: string; userName: string}[]
  >([]);
  const collaboratorIds = taggedUsers.map(u => u._id);

  const [modalVisible, setModalVisible] = useState(false);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState(
    Array.isArray(routeMedia) ? routeMedia : [],
  );
  const [visibility, setVisibility] = useState<'self' | 'public' | 'followers'>(
    'followers',
  );

  const [tagModalVisible, setTagModalVisible] = useState(false);

  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation>(null);

  const {requestLocationPermission, hasPermission, location} =
    useLocationPermission();

  const handleCreatePost = async () => {
    try {
      setLoading(true);

      const files = media.map((item: any) => ({
        uri: item.uri,
        type: mime.getType(item.uri) || 'image/jpeg',
        name: item.uri.split('/').pop() || `file-${Date.now()}.jpg`,
      }));

      const locationForApi = selectedLocation
        ? {
            latitude: String(selectedLocation.lat ?? location?.latitude ?? ''),
            longitude: String(
              selectedLocation.lng ?? location?.longitude ?? '',
            ),
            name: selectedLocation.address?.split(',')[0]?.trim() || 'Location',
            address: selectedLocation.address || '',
          }
        : undefined;
      myConsole('collaboratorIds', collaboratorIds);
      const postData = {
        type: 'post' as const,
        desc: caption,
        collaborators: collaboratorIds,
        ...(locationForApi ? {location: locationForApi} : {}),
        files,
        visible_to: visibility,
      };
      myConsole('Creating post with data:', JSON.stringify(postData, null, 2));
      const response = await createPost(postData);
      myConsole('Create post API response:', JSON.stringify(response, null, 2));

      toast.success('Post added successfully');
      // @ts-ignore
      navigation.navigate('HomeStack', {screen: homeRoute.AllStories});
    } catch (err) {
      console.error(err);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{flex: 1}}>
      <HeaderBar
        title="Add post"
        leftIcon={require('../../assets/icons/back.png')}
        // @ts-ignore
        onLeftPress={() => navigation.goBack()}
      />

      <FlatList
        data={Array.isArray(media) ? media : []}
        horizontal
        keyExtractor={(item, index) => `${item?.uri ?? 'item'}-${index}`}
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
        taggedUsers={taggedUsers}
        onTagPress={() => setTagModalVisible(true)}
        onLocationPress={async () => {
          try {
            await requestLocationPermission();
          } finally {
            setLocationSheetVisible(true);
          }
        }}
        setCaption={setCaption}
        visibility={visibility}
        selectedLocation={selectedLocation}
      />

      <ShowHideModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selected={visibility}
        onSelect={val => {
          setVisibility(val);
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

      <LocationPickerBottomSheet
        visible={locationSheetVisible}
        onClose={() => setLocationSheetVisible(false)}
        onSelect={place => {
          setSelectedLocation({
            address: place.address,
            placeId: place.placeId,
            lat: place.lat,
            lng: place.lng,
          });
        }}
        modalHeight={600}
        placeholder="Search location..."
        initialValue={selectedLocation?.address || ''}
      />

      <TagPeopleModal
        visible={tagModalVisible}
        onClose={() => setTagModalVisible(false)}
        preselectedIds={taggedUsers.map(u => u._id)}
        onConfirm={users => {
          const uniq: Record<string, {_id: string; userName: string}> = {};
          users.forEach(u => {
            if (!u._id) return;
            uniq[u._id] = {_id: u._id, userName: u.userName || 'user'};
          });
          setTaggedUsers(Object.values(uniq));
          setTagModalVisible(false);
        }}
      />
    </View>
  );
};

export default ComposePostScreen;
