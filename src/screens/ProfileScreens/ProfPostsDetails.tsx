// src/screens/profile/ProfPostsDetails.tsx
import React, {useState} from 'react';
import {
  ScrollView,
  View,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import CustomText from '../../components/CustomText';
import {myConsole} from '../../utils/myConsole';
import {deletePost, useGetUserPosts} from '../../api/posts/postFunc';
import {color} from '../../const/color';
import {sizes} from '../../const';
import Video from 'react-native-video';
import FullHeightLoader from '../../components/LoadingCompo/FullHeightLoader';
import {useAppToast} from '../../components/toast/AppToast';
import {useQueryClient} from '@tanstack/react-query';
import {useComments} from '../../hooks/comments/useComments';
import {useGetUserById} from '../../api/user/userFunc';
import {RouteProp, useRoute} from '@react-navigation/native';
import Carousel from 'react-native-reanimated-carousel';
import LikesModal from './components/LikesModal';
import CommentsModal from './components/CommentsModal';
import LoadingCompo from '../../components/LoadingCompo/LoadingCompo';
import {renderTextWithLinks} from '../../utils/renderTextWithLinks';
import {useGetMyData} from '../../api/profile/profileFunc';

const ProfPostsDetails = ({userId: propUserId}: {userId?: string}) => {
  type ProfPostsRouteParams = {
    userId?: string;
  };

  const route =
    useRoute<RouteProp<Record<string, ProfPostsRouteParams>, string>>();

  const {data: myData} = useGetMyData();
  myConsole('myDataddd', myData);
  const routeUserId = route.params?.userId || myData?.data?._id;
  const userId = propUserId || routeUserId || myData?.data?._id;

  const toast = useAppToast();
  const q = useQueryClient();

  const [selectedTab, setSelectedTab] = useState<'post' | 'reel' | 'collab'>(
    'post',
  );
  const tabs = [
    {key: 'post', label: 'Posts', icon: require('../../assets/icons/grid.png')},
    {
      key: 'reel',
      label: 'Reels',
      icon: require('../../assets/icons/video.png'),
    },
    {
      key: 'collab',
      label: 'Collab',
      icon: require('../../assets/icons/collab.png'),
    },
  ];
  const indicatorAnim = useState(new Animated.Value(0))[0];

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showLikes, setShowLikes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const {width} = Dimensions.get('window');

  myConsole('User ID:', userId);

  const {
    data: postsData,
    isLoading,
    isError,
  } = useGetUserPosts(userId, {
    limit: 6,
    page: 1,
    type: selectedTab === 'collab' ? 'all' : selectedTab,
    isCollaborative: selectedTab === 'collab' ? true : undefined,
  } as any);

  const {comments} = useComments({postId: selectedPost?._id, limit: 10});
  myConsole('comments', comments);
  if (isLoading) return <LoadingCompo />;
  if (isError) return <CustomText>Error loading posts</CustomText>;

  const allPosts = postsData?.data?.posts ?? [];

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePost(postId)
            .then(() => {
              myConsole('Post deleted', postId);
              toast.success('Post deleted successfully!');
              q.invalidateQueries({queryKey: ['postsByUser', userId]});
            })
            .catch(err => {
              myConsole('Delete failed', err);
              toast.error('Failed to delete post');
            });
        },
      },
    ]);
  };

  return (
    <View style={{flex: 1, backgroundColor: '#f8f9fa'}}>
      {/* ====== Enhanced Top Tabs ====== */}
      <View
        style={{
          backgroundColor: '#ffffff',
          paddingVertical: 16,
          paddingHorizontal: 8,
          marginTop: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                setSelectedTab(tab.key as any);
                Animated.spring(indicatorAnim, {
                  toValue: index,
                  speed: 20,
                  bounciness: 6,
                  useNativeDriver: true,
                }).start();
              }}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor:
                  selectedTab === tab.key ? '#f0f7ff' : 'transparent',
              }}>
              <Image
                source={tab.icon}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: selectedTab === tab.key ? color.mainColor : '#666',
                  marginBottom: 4,
                }}
              />
              <CustomText
                style={{
                  fontSize: 14,
                  fontWeight: selectedTab === tab.key ? '700' : '500',
                  color: selectedTab === tab.key ? color.mainColor : '#666',
                }}>
                {tab.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enhanced Sliding Indicator */}
        <View style={{height: 2, backgroundColor: '#f0f0f0', marginTop: 8}}>
          <Animated.View
            style={{
              height: 3,
              width: `${100 / tabs.length}%`,
              backgroundColor: color.mainColor,
              borderRadius: 2,
              transform: [
                {
                  translateX: indicatorAnim.interpolate({
                    inputRange: tabs.map((_, i) => i),
                    outputRange: tabs.map((_, i) => (i * width) / tabs.length),
                  }),
                },
              ],
            }}
          />
        </View>
      </View>

      {/* ====== Enhanced Posts Grid ====== */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 8,
        }}
        showsVerticalScrollIndicator={false}>
        {allPosts.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 100,
            }}>
            <Image
              source={require('../../assets/icons/noDataFound.png')}
              style={{width: 120, height: 120, opacity: 0.5, marginBottom: 16}}
            />
            <CustomText
              style={{
                fontSize: 16,
                color: '#999',
                textAlign: 'center',
                fontWeight: '500',
              }}>
              {selectedTab === 'post'
                ? 'No posts yet'
                : selectedTab === 'reel'
                ? 'No reels uploaded'
                : 'No collaborative posts'}
            </CustomText>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}>
            {allPosts.map((post: any, index: number) => (
              <TouchableOpacity
                key={post._id}
                style={{
                  flexBasis: (width - 32) / 3,
                  aspectRatio: 1,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
                onPress={() => setSelectedPost(post)}
                onLongPress={() => handleDeletePost(post._id)}
                delayLongPress={800}>
                {post.media?.[0] ? (
                  post.media[0].type === 'video' ? (
                    <View style={{flex: 1}}>
                      <Video
                        source={{uri: post.media[0].url}}
                        style={{flex: 1}}
                        resizeMode="cover"
                        muted
                        repeat
                        paused
                      />
                      {/* Video overlay indicator */}
                      <View
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          borderRadius: 12,
                          padding: 4,
                        }}>
                        <Image
                          source={require('../../assets/icons/play.png')}
                          style={{width: 16, height: 16, tintColor: '#fff'}}
                        />
                      </View>
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          left: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <Image
                          source={require('../../assets/icons/play.png')}
                          style={{
                            width: 12,
                            height: 12,
                            tintColor: '#fff',
                            marginRight: 4,
                          }}
                        />
                        <CustomText style={{color: '#fff', fontSize: 12}}>
                          {post.media.length > 1 ? `${post.media.length}` : ''}
                        </CustomText>
                      </View>
                    </View>
                  ) : (
                    <View style={{flex: 1}}>
                      <Image
                        source={{uri: post.media[0].url}}
                        style={{flex: 1}}
                        resizeMode="cover"
                      />
                      {post.media.length > 1 && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                          }}>
                          <CustomText
                            style={{
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: '600',
                            }}>
                            {post.media.length}
                          </CustomText>
                        </View>
                      )}
                    </View>
                  )
                ) : (
                  <View
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#9f0000ff',
                    }}>
                    <Image
                      source={require('../../assets/icons/image.png')}
                      style={{width: 40, height: 40, opacity: 0.3}}
                    />
                  </View>
                )}

                {/* Engagement overlay */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 6,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                  }}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Image
                      source={require('../../assets/animatedIcons/like.png')}
                      style={{
                        width: 14,
                        height: 14,
                        tintColor: '#fff',
                        marginRight: 4,
                      }}
                    />
                    <CustomText style={{color: '#fff', fontSize: 12}}>
                      {post.likeCount || 0}
                    </CustomText>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Image
                      source={require('../../assets/icons/message.png')}
                      style={{
                        width: 14,
                        height: 14,
                        tintColor: '#fff',
                        marginRight: 4,
                      }}
                    />
                    <CustomText style={{color: '#fff', fontSize: 12}}>
                      {post.commentCount || 0}
                    </CustomText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ====== Enhanced Post Details Modal ====== */}
      {selectedPost && (
        <Modal
          key={selectedPost?._id}
          visible
          animationType="slide"
          onRequestClose={() => setSelectedPost(null)}
          presentationStyle="fullScreen"
          statusBarTranslucent>
          <View style={{flex: 1, backgroundColor: '#000'}}>
            {/* Enhanced Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                paddingTop: 50,
                backgroundColor: 'rgba(0,0,0,0.8)',
              }}>
              <TouchableOpacity
                onPress={() => setSelectedPost(null)}
                style={{
                  padding: 10,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 20,
                }}>
                <Image
                  source={require('../../assets/icons/back.png')}
                  style={{width: 20, height: 20, tintColor: '#fff'}}
                />
              </TouchableOpacity>

              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <CustomText
                  style={{color: '#fff', fontSize: 16, fontWeight: '600'}}>
                  {currentMediaIndex + 1} / {selectedPost?.media?.length || 1}
                </CustomText>
              </View>

              <TouchableOpacity
                onPress={() => handleDeletePost(selectedPost._id)}
                style={{
                  padding: 10,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 20,
                }}>
                <Image
                  source={require('../../assets/icons/delete.png')}
                  style={{width: 20, height: 20, tintColor: '#ff6b6b'}}
                />
              </TouchableOpacity>
            </View>

            {/* Enhanced Carousel Area */}
            <Carousel
              width={width}
              height={500}
              data={selectedPost?.media || []}
              loop={false}
              scrollAnimationDuration={800}
              onSnapToItem={setCurrentMediaIndex}
              renderItem={({item: m, index}) => (
                <View key={m._id} style={{flex: 1, marginTop: 20}}>
                  {m.type === 'video' ? (
                    <View style={{flex: 1}}>
                      <Video
                        source={{uri: m.url}}
                        style={{
                          width: '100%',
                          height: 500,
                          backgroundColor: '#000',
                        }}
                        resizeMode="contain"
                        muted={isMuted}
                        repeat
                        controls
                      />
                      <TouchableOpacity
                        onPress={() => setIsMuted(!isMuted)}
                        style={{
                          position: 'absolute',
                          bottom: 20,
                          right: 20,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          padding: 12,
                          borderRadius: 25,
                          borderWidth: 2,
                          borderColor: 'rgba(255,255,255,0.3)',
                        }}>
                        <Image
                          source={
                            isMuted
                              ? require('../../assets/icons/speakerOff.png')
                              : require('../../assets/icons/speakerOn.png')
                          }
                          style={{width: 24, height: 24, tintColor: '#fff'}}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Image
                      source={{uri: m.url}}
                      style={{
                        width: '100%',
                        height: 500,
                        backgroundColor: '#111',
                      }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              )}
            />

            {/* Enhanced Description & Actions */}
            <View style={{flex: 1, padding: 20}}>
              <ScrollView
                contentContainerStyle={{flexGrow: 1}}
                showsVerticalScrollIndicator={false}>
                {/* Description Card */}
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                  }}>
                  {renderTextWithLinks(selectedPost.desc || 'No description', {
                    linkColor: '#4da6ff',
                    textStyle: {color: 'white', fontSize: 16, lineHeight: 22},
                  })}
                </View>

                {/* Enhanced Engagement Stats */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    padding: 16,
                  }}>
                  <TouchableOpacity
                    onPress={() => setShowLikes(true)}
                    style={{
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      flex: 1,
                      marginHorizontal: 4,
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Image
                        source={require('../../assets/animatedIcons/like.png')}
                        style={{
                          width: 24,
                          height: 24,
                          tintColor: '#ff6b6b',
                          marginRight: 8,
                        }}
                      />
                      <CustomText
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: '600',
                        }}>
                        {selectedPost.likeCount || 0}
                      </CustomText>
                    </View>
                    <CustomText
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 12,
                        marginTop: 4,
                      }}>
                      Likes
                    </CustomText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowComments(true)}
                    style={{
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      flex: 1,
                      marginHorizontal: 4,
                    }}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Image
                        source={require('../../assets/icons/message.png')}
                        style={{
                          width: 24,
                          height: 24,
                          tintColor: '#4da6ff',
                          marginRight: 8,
                        }}
                      />
                      <CustomText
                        style={{
                          color: 'white',
                          fontSize: 16,
                          fontWeight: '600',
                        }}>
                        {selectedPost.commentCount || 0}
                      </CustomText>
                    </View>
                    <CustomText
                      style={{
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: 12,
                        marginTop: 4,
                      }}>
                      Comments
                    </CustomText>
                  </TouchableOpacity>
                </View>

                {/* Media Indicators */}
                {selectedPost?.media?.length > 1 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      marginTop: 20,
                    }}>
                    {selectedPost.media.map((_: any, index: number) => (
                      <View
                        key={index}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor:
                            index === currentMediaIndex
                              ? color.mainColor
                              : 'rgba(255,255,255,0.3)',
                          marginHorizontal: 4,
                        }}
                      />
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      <LikesModal
        visible={showLikes}
        onClose={() => setShowLikes(false)}
        likes={selectedPost?.likes}
      />

      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        comments={selectedPost?.comments}
      />
    </View>
  );
};

export default ProfPostsDetails;
