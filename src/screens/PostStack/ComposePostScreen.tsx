import React, {useState} from 'react';
import {FlatList, Image, TouchableOpacity, View} from 'react-native';
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
import useLocationPermission from '../../hooks/useLocationPermission';
import LocationPickerBottomSheet from '../../components/LocationPickerBottomSheet';

type SelectedLocation = {
  address: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
} | null;

const ComposePostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {media: routeMedia = [] as any[]} = (route.params as any) || {};

  const [modalVisible, setModalVisible] = useState(false);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState(
    Array.isArray(routeMedia) ? routeMedia : [],
  );
  const [visibility, setVisibility] = useState<'self' | 'public' | 'followers'>(
    'followers',
  );

  // NEW: location state + sheet visibility
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

      const postData = {
        type: 'post' as const,
        desc: caption,
        ...(locationForApi ? {location: locationForApi} : {}),
        files,
        visible_to: visibility,
      };
      console.log('[post] payload.location →', locationForApi ?? 'OMITTED');
      console.log('[post] payload.location →', selectedLocation ?? 'OMITTED');

      myConsole('Creating post with data:', JSON.stringify(postData, null, 2));

      const response = await createPost(postData);
      myConsole('Create post API response:', JSON.stringify(response, null, 2));

      showSuccessToast({description: 'Post added successfully'});
      // @ts-ignore
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
        onLocationPress={async () => {
          console.log(
            '[location] before request → hasPermission:',
            hasPermission,
            'coords:',
            location,
          );
          try {
            await requestLocationPermission();
          } catch (e) {
            console.log('[location] request error (ignored):', e);
          } finally {
            console.log(
              '[location] after request → hasPermission:',
              hasPermission,
              'coords:',
              location,
            );
            setLocationSheetVisible(true); // open Places UI regardless
          }
        }}
        setCaption={setCaption}
        visibility={visibility}
        selectedLocation={selectedLocation}
      />

      {/* Show/Hide audience modal */}
      <ShowHideModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={place => {
          setSelectedLocation({
            address: place.address,
            placeId: place.placeId,
            lat: place.lat ?? location?.latitude ?? null,
            lng: place.lng ?? location?.longitude ?? null,
          });
          console.log('[location] selectedLocation set →', {
            address: place.address,
            placeId: place.placeId,
            lat: place.lat ?? location?.latitude ?? null,
            lng: place.lng ?? location?.longitude ?? null,
          });
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

      {/* NEW: Google Places Autocomplete Bottom Sheet */}
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
    </View>
  );
};

export default ComposePostScreen;
