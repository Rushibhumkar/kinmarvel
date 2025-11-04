// src/screens/profile/components/LikesModal.tsx
import React from 'react';
import {Modal, View, TouchableOpacity, FlatList, Image} from 'react-native';
import CustomText from '../../../components/CustomText';
import {color} from '../../../const/color';
import {useGetUserById} from '../../../api/user/userFunc';

// --- Subcomponent: LikeItem ---
const LikeItem = ({userId}: {userId: string}) => {
  const {data: userData, isLoading, isError} = useGetUserById(userId);

  if (isLoading)
    return (
      <CustomText style={{paddingVertical: 8, color: '#888'}}>
        Loading...
      </CustomText>
    );
  if (isError || !userData?.data)
    return (
      <CustomText style={{paddingVertical: 8, color: 'red'}}>
        Unknown User
      </CustomText>
    );

  const user = userData.data;
  const name =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.userName;

  return (
    <View
      style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 8}}>
      {user.profileImageUrl ? (
        <Image
          source={{uri: user.profileImageUrl}}
          style={{height: 36, width: 36, borderRadius: 18, marginRight: 8}}
        />
      ) : (
        <View
          style={{
            height: 36,
            width: 36,
            borderRadius: 18,
            backgroundColor: '#ccc',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 8,
          }}>
          <CustomText>{name?.[0]?.toUpperCase() || '?'}</CustomText>
        </View>
      )}
      <CustomText style={{fontSize: 15}}>{name}</CustomText>
    </View>
  );
};

// --- Main Component ---
const LikesModal = ({visible, onClose, likes}: any) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}>
        <View
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '50%',
            padding: 16,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <CustomText style={{fontSize: 18, fontWeight: '600'}}>
              Likes
            </CustomText>
            <TouchableOpacity onPress={onClose}>
              <CustomText style={{color: color.mainColor}}>Close</CustomText>
            </TouchableOpacity>
          </View>

          {likes?.length > 0 ? (
            <FlatList
              data={likes}
              keyExtractor={item => item._id}
              renderItem={({item}) => <LikeItem userId={item.by} />}
            />
          ) : (
            <View
              style={{
                minHeight: 200,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <CustomText>No likes yet</CustomText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default LikesModal;
