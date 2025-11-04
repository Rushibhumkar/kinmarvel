// src/screens/profile/components/CommentsModal.tsx
import React from 'react';
import {Modal, View, TouchableOpacity, FlatList} from 'react-native';
import CustomText from '../../../components/CustomText';
import {color} from '../../../const/color';
import {myConsole} from '../../../utils/myConsole';

const CommentsModal = ({visible, onClose, comments}: any) => {
  myConsole('commenmmms', comments);
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
              Comments
            </CustomText>
            <TouchableOpacity onPress={onClose}>
              <CustomText style={{color: color.mainColor}}>Close</CustomText>
            </TouchableOpacity>
          </View>

          {comments?.length > 0 ? (
            <FlatList
              data={comments}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({item}) => {
                const user = item?.by;
                const name =
                  user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.userName || 'Unknown';

                return (
                  <View
                    style={{
                      paddingVertical: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <CustomText
                      style={{
                        fontWeight: '600',
                        color: '#000',
                      }}
                      fontSize={16}>
                      {name}{' '}
                    </CustomText>
                    <CustomText style={{marginTop: 4, color: '#555'}}>
                      : {item?.content || ''}
                    </CustomText>
                  </View>
                );
              }}
            />
          ) : (
            <View
              style={{
                minHeight: 200,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <CustomText>No comments yet</CustomText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default CommentsModal;
