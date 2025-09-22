// src/screens/profile/ProfPostsDetails.tsx
import React, {useState} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import MainContainer from '../../components/MainContainer';
import CustomText from '../../components/CustomText';
import {myConsole} from '../../utils/myConsole';
import {useGetMyData} from '../../api/profile/profileFunc';
import {deletePost, useGetUserPosts} from '../../api/posts/postFunc';
import {color} from '../../const/color';
import {sizes} from '../../const';
import Video from 'react-native-video';
import FullHeightLoader from '../../components/LoadingCompo/FullHeightLoader';
import {useAppToast} from '../../components/toast/AppToast';
import {useQueryClient} from '@tanstack/react-query';

const ProfPostsDetails = ({route}: any) => {
  const {item} = route.params; // "Posts" or "Collaborations"
  const {data: myData} = useGetMyData();
  const userId = myData?.data?._id;
  const toast = useAppToast();

  const {data: postsData, isLoading, isError} = useGetUserPosts(userId);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showLikes, setShowLikes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  if (isLoading) {
    return (
      <MainContainer title={item} isBack>
        <FullHeightLoader />
      </MainContainer>
    );
  }

  if (isError) {
    return (
      <MainContainer title={item} isBack>
        <CustomText>Error loading posts</CustomText>
      </MainContainer>
    );
  }

  // filter posts if collaborators view
  const allPosts = postsData?.data?.posts ?? [];
  const filteredPosts =
    item === 'Collaborations'
      ? allPosts.filter((p: any) => p.isCollaborativePost)
      : allPosts;
  const q = useQueryClient();
  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePost(postId)
              .then(() => {
                myConsole('Post deleted', postId);
                toast.success('post deleted successfully!');
                q.invalidateQueries({queryKey: ['postsByUser', userId]});
              })
              .catch(err => {
                myConsole('Delete failed', err);
                toast.error('failed to delete post');
              });
          },
        },
      ],
      {cancelable: true},
    );
  };
  return (
    <MainContainer title={item} isBack>
      <ScrollView contentContainerStyle={{flexGrow: 1, padding: 8}}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {filteredPosts.map((post: any, index: number) => (
            <TouchableOpacity
              key={post._id}
              style={{
                margin: 4,
                flexBasis: sizes.width / 3 - 16,
                aspectRatio: 1,
              }}
              onPress={() => setSelectedPost(post)}
              onLongPress={() => handleDeletePost(post._id)}
              delayLongPress={800} // ~0.8s long press
            >
              {post.media?.[0] ? (
                post.media[0].type === 'video' ? (
                  <View style={{flex: 1, borderRadius: 8, overflow: 'hidden'}}>
                    <Video
                      source={{uri: post.media[0].url}}
                      style={{flex: 1}}
                      resizeMode="cover"
                      muted
                      repeat
                      paused={true} // 👈 show first frame only, no autoplay
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: '40%',
                        left: '40%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: 20,
                        padding: 6,
                      }}>
                      <CustomText style={{color: 'white'}}>▶</CustomText>
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{uri: post.media[0].url}}
                    style={{flex: 1, borderRadius: 8}}
                    resizeMode="cover"
                  />
                )
              ) : (
                <View
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    backgroundColor: color.smoothBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <CustomText>No Media</CustomText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Post Details Modal */}
      <Modal
        visible={!!selectedPost}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}>
        {selectedPost && (
          <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.9)'}}>
            <TouchableOpacity
              onPress={() => setSelectedPost(null)}
              style={{padding: 16, alignSelf: 'flex-end'}}>
              <CustomText style={{color: 'white'}}>Close</CustomText>
            </TouchableOpacity>

            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{padding: 16, paddingBottom: 40}}
              showsVerticalScrollIndicator={true}>
              {selectedPost.media?.map((m: any) => (
                <View key={m._id} style={{marginBottom: 12}}>
                  {m.type === 'video' ? (
                    <View style={{marginBottom: 12}}>
                      <Video
                        source={{uri: m.url}}
                        style={{width: '100%', height: 800, borderRadius: 8}}
                        resizeMode="cover"
                        muted={isMuted}
                        repeat
                        controls={true} // gives play/pause/seek controls
                      />
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          padding: 8,
                          borderRadius: 20,
                        }}
                        onPress={() => setIsMuted(!isMuted)}>
                        <CustomText style={{color: 'white'}}>
                          {isMuted ? '🔇' : '🔊'}
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Image
                      source={{uri: m.url}}
                      style={{width: '100%', height: 300, borderRadius: 8}}
                      resizeMode="cover"
                    />
                  )}
                </View>
              ))}

              <CustomText style={{color: 'white', marginVertical: 8}}>
                {selectedPost.desc || 'No description'}
              </CustomText>

              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 20}}>
                <TouchableOpacity
                  onPress={() => setShowLikes(true)}
                  style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Image
                    source={require('../../assets/animatedIcons/like.png')}
                    style={{height: 24, width: 24}}
                  />
                  <CustomText style={{color: 'white'}}>
                    {selectedPost.likeCount}
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowComments(true)}
                  style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                  <Image
                    source={require('../../assets/icons/message.png')}
                    tintColor={'#fff'}
                    style={{height: 24, width: 24}}
                  />
                  <CustomText style={{color: 'white'}}>
                    {selectedPost.commentCount}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Likes Bottom Sheet */}
      <Modal
        visible={showLikes}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLikes(false)}>
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
                gap: 20,
                alignItems: 'center',
              }}>
              <CustomText style={{fontSize: 18, fontWeight: '600'}}>
                Likes
              </CustomText>
              <TouchableOpacity onPress={() => setShowLikes(false)}>
                <CustomText style={{color: color.mainColor}}>Close</CustomText>
              </TouchableOpacity>
            </View>
            {selectedPost?.likes.length > 0 ? (
              <FlatList
                data={selectedPost?.likes || []}
                keyExtractor={item => item._id}
                renderItem={({item}) => (
                  <CustomText style={{paddingVertical: 8}}>
                    {item.by}
                  </CustomText>
                )}
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

      {/* Comments Bottom Sheet */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}>
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
                gap: 20,
                alignItems: 'center',
              }}>
              <CustomText style={{fontSize: 18, fontWeight: '600'}}>
                Comments
              </CustomText>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <CustomText style={{color: color.mainColor}}>Close</CustomText>
              </TouchableOpacity>
            </View>
            {selectedPost?.comments.length > 0 ? (
              <FlatList
                data={selectedPost?.comments || []}
                keyExtractor={id => id}
                renderItem={({item}) => (
                  <CustomText style={{paddingVertical: 8}}>{item}</CustomText>
                )}
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
    </MainContainer>
  );
};

export default ProfPostsDetails;
