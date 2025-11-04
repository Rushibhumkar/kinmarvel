import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useGetUserPosts} from '../../api/posts/postFunc';
import {myConsole} from '../../utils/myConsole';

const UserPosts = ({userId}: any) => {
  const {data: posts, isLoading, isError, refetch} = useGetUserPosts(userId);
  myConsole('posts', posts);
  return (
    <View>
      <Text>UserPosts</Text>
    </View>
  );
};

export default UserPosts;

const styles = StyleSheet.create({});
