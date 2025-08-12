import React, {useState} from 'react';
import {View} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {Google_Maps_Api_Key} from '../api/axiosInstance';

export default function LocationSearch({setSelectedLocation}: any) {
  return (
    <View style={{flex: 1}}>
      <GooglePlacesAutocomplete
        placeholder="Search location"
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (details) {
            setSelectedLocation({
              name: data.structured_formatting.main_text,
              address: details.formatted_address,
              latitude: details.geometry.location.lat,
              longitude: details.geometry.location.lng,
            });
          }
        }}
        query={{
          key: Google_Maps_Api_Key,
          language: 'en',
        }}
        styles={{
          textInput: {
            height: 44,
            color: '#000',
            fontSize: 16,
          },
          listView: {
            backgroundColor: 'white',
          },
        }}
      />
    </View>
  );
}
