import React, {memo, useEffect, useRef, useState} from 'react';
import {View, Platform, TouchableOpacity, Text} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import CustomBottomModal from './CustomBottomModal';
import {Google_Maps_Api_Key} from '../api/axiosInstance';

type PlaceResult = {
  address: string;
  placeId: string;
  lat: number | null;
  lng: number | null;
  raw?: any;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: PlaceResult) => void;
  modalHeight?: number;
  placeholder?: string;
  initialValue?: string;
};

const LocationPickerBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  onSelect,
  modalHeight = 600,
  placeholder = 'Search location...',
  initialValue,
}) => {
  const ref = useRef<any>(null);

  const [searchText, setSearchText] = useState(initialValue || '');

  // Log sheet visibility changes + key status
  useEffect(() => {
    const keyMasked = (Google_Maps_Api_Key || '').replace(/.(?=.{4})/g, '*');
    // console.log('[PlacesSheet] visible:', visible, ' | key:', keyMasked);
  }, [visible]);

  // Log mount
  useEffect(() => {
    // console.log('[PlacesSheet] mounted with initialValue:', initialValue || '');
    return () => console.log('[PlacesSheet] unmounted');
  }, []);

  // Patch RN Android Networking timeout null crash
  useEffect(() => {
    if (Platform.OS === 'android' && typeof XMLHttpRequest !== 'undefined') {
      try {
        const proto = XMLHttpRequest.prototype as any;
        const originalOpen = proto.open;
        proto.open = function (...args: any[]) {
          if (this && (this.timeout === null || this.timeout === undefined)) {
            this.timeout = 0;
          }
          return originalOpen.apply(this, args);
        };
        // console.log('[PlacesSheet] XHR timeout patch applied');
      } catch (e) {
        // console.log('[PlacesSheet] XHR timeout patch failed:', e);
      }
    }
  }, []);

  const handleClear = () => {
    setSearchText('');
    try {
      ref.current?.setAddressText?.('');
      ref.current?.clear?.();
    } catch {}
  };

  return (
    <CustomBottomModal
      visible={visible}
      onClose={() => {
        // console.log('[PlacesSheet] onClose called');
        onClose();
      }}
      modalHeight={modalHeight}>
      <View style={{flex: 1}}>
        <GooglePlacesAutocomplete
          ref={ref}
          placeholder={placeholder}
          fetchDetails
          enablePoweredByContainer={false}
          nearbyPlacesAPI="GooglePlacesSearch"
          debounce={250}
          minLength={2}
          predefinedPlaces={[]}
          predefinedPlacesAlwaysVisible={false}
          query={{
            key: Google_Maps_Api_Key || '',
            language: 'en',
          }}
          onPress={(data, details) => {
            try {
              const lat = details?.geometry?.location?.lat ?? null;
              const lng = details?.geometry?.location?.lng ?? null;
              const address =
                details?.formatted_address ||
                data?.description ||
                details?.name ||
                '';

              const payload = {
                address,
                placeId: data?.place_id ?? '',
                lat,
                lng,
                raw: {data, details},
              };

              // console.log('[PlacesSheet:onPress] selecting place:', payload);
              onSelect(payload);
              onClose();
            } catch (err) {
              // console.log('[PlacesSheet:onPress] ERROR:', err);
            }
          }}
          onFail={error => {
            // console.log('[GooglePlacesAutocomplete] onFail:', error);
          }}
          onNotFound={() => {
            // console.log('[GooglePlacesAutocomplete] No results');
          }}
          // Make input text black + controlled value
          textInputProps={{
            value: searchText,
            onChangeText: (t: string) => {
              setSearchText(t);
              // console.log('[PlacesSheet:input] text:', t);
            },
            placeholderTextColor: '#888',
            returnKeyType: 'search',
            autoFocus: true,
            style: {
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: Platform.select({ios: 12, android: 10}),
              fontSize: 16,
              marginBottom: 12,
              color: '#000', // <-- black input text
              //   backgroundColor: 'red',
              width: '100%',
            },
          }}
          // Add a right-side clear (×) button inside the input
          renderRightButton={() =>
            searchText?.length ? (
              <TouchableOpacity
                onPress={handleClear}
                activeOpacity={0.7}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: Platform.select({ios: 10, android: 8}),
                  height: 28,
                  minWidth: 28,
                  paddingHorizontal: 8,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#eee',
                }}>
                <Text style={{fontSize: 16, color: '#000'}}>×</Text>
              </TouchableOpacity>
            ) : null
          }
          styles={{
            container: {flex: 1},
            textInputContainer: {
              backgroundColor: 'transparent',
            },
            listView: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#eee',
            },
            row: {
              backgroundColor: '#fff',
              paddingVertical: 12,
              paddingHorizontal: 12,
            },
            separator: {height: 1, backgroundColor: '#f0f0f0'},
            description: {fontSize: 15, color: '#000'}, // <-- black list text
            predefinedPlacesDescription: {color: '#000'},
            poweredContainer: {display: 'none'},
          }}
          GooglePlacesDetailsQuery={{
            fields: 'formatted_address,geometry,name,place_id',
          }}
          keyboardShouldPersistTaps="always"
        />
      </View>
    </CustomBottomModal>
  );
};

export default memo(LocationPickerBottomSheet);
