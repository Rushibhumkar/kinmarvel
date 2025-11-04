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

const ProfPostsDetails = ({userId: propUserId}: {userId?: string}) => {
  type ProfPostsRouteParams = {
    userId?: string;
  };

  const route =
    useRoute<RouteProp<Record<string, ProfPostsRouteParams>, string>>();
  const routeUserId = route.params?.userId;
  const userId = propUserId || routeUserId;

  const toast = useAppToast();
  const q = useQueryClient();

  const [selectedTab, setSelectedTab] = useState<'post' | 'reel' | 'collab'>(
    'post',
  );
  const tabs = [
    {key: 'post', label: 'Posts'},
    {key: 'reel', label: 'Reels'},
    {key: 'collab', label: 'Collaborative'},
  ];
  const indicatorAnim = useState(new Animated.Value(0))[0];

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showLikes, setShowLikes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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
    <View style={{flex: 1}}>
      {/* ====== Top Tabs ====== */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          borderBottomWidth: 1,
          borderBottomColor: '#eaeaea',
          backgroundColor: color.smoothBg,
          paddingVertical: 10,
          marginTop: 12,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => {
              setSelectedTab(tab.key as any);
              Animated.spring(indicatorAnim, {
                toValue: index,
                speed: 20, // ⏩ faster movement
                bounciness: 6, // slight bounce effect (optional)
                useNativeDriver: true,
              }).start();
            }}
            activeOpacity={0.8}
            style={{flex: 1, alignItems: 'center'}}>
            <CustomText
              style={{
                fontSize: 16,
                fontWeight: selectedTab === tab.key ? '700' : '500',
                color:
                  selectedTab === tab.key ? color.mainColor : 'rgba(0,0,0,0.6)',
              }}>
              {tab.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </View>

      {/* ====== Sliding Indicator ====== */}
      <View style={{height: 3, backgroundColor: '#eaeaea', width: '100%'}}>
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            height: 3,
            width: `${100 / tabs.length}%`,
            backgroundColor: color.mainColor,
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

      {/* ====== Posts Grid ====== */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          width: sizes.width,
          alignSelf: 'flex-start',
          paddingVertical: 12,
        }}>
        {allPosts.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 100,
            }}>
            <CustomText
              style={{
                fontSize: 16,
                color: 'rgba(0,0,0,0.6)',
                textAlign: 'center',
              }}>
              {selectedTab === 'post'
                ? 'No posts available for this user.'
                : selectedTab === 'reel'
                ? 'No reels uploaded by this user.'
                : 'No collaborative posts found.'}
            </CustomText>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
            }}>
            {allPosts.map((post: any) => (
              <TouchableOpacity
                key={post._id}
                style={{
                  flexBasis: sizes.width / 3 - 16,
                  aspectRatio: 1,
                }}
                onPress={() => setSelectedPost(post)}
                onLongPress={() => handleDeletePost(post._id)}
                delayLongPress={800}>
                {post.media?.[0] ? (
                  post.media[0].type === 'video' ? (
                    <View
                      style={{flex: 1, borderRadius: 8, overflow: 'hidden'}}>
                      <Video
                        source={{uri: post.media[0].url}}
                        style={{flex: 1}}
                        resizeMode="cover"
                        muted
                        repeat
                        paused
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
        )}
      </ScrollView>

      {/* ====== Post Details Modal ====== */}
      {selectedPost && (
        <Modal
          key={selectedPost?._id}
          visible
          animationType="slide"
          onRequestClose={() => setSelectedPost(null)}
          presentationStyle="fullScreen"
          statusBarTranslucent>
          <View style={{flex: 1, backgroundColor: '#000'}}>
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                padding: 16,
                paddingTop: 50,
                backgroundColor: 'rgba(0,0,0,0.6)',
              }}>
              <TouchableOpacity
                onPress={() => setSelectedPost(null)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 24,
                }}>
                <CustomText style={{color: 'white', fontSize: 15}}>
                  Close
                </CustomText>
              </TouchableOpacity>
            </View>

            {/* ====== Carousel Area ====== */}
            <Carousel
              width={width}
              height={600}
              data={selectedPost?.media || []}
              loop={false}
              scrollAnimationDuration={800}
              renderItem={({item: m}) => (
                <View key={m._id} style={{flex: 1}}>
                  {m.type === 'video' ? (
                    <View style={{flex: 1}}>
                      <Video
                        source={{uri: m.url}}
                        style={{
                          width: '100%',
                          height: 600,
                          borderRadius: 8,
                          backgroundColor: '#000',
                        }}
                        resizeMode="cover"
                        muted={isMuted}
                        repeat
                        controls
                      />
                      <TouchableOpacity
                        onPress={() => setIsMuted(!isMuted)}
                        style={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          padding: 8,
                          borderRadius: 20,
                        }}>
                        <CustomText style={{color: 'white'}}>
                          {isMuted ? '🔇' : '🔊'}
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Image
                      source={{uri: m.url}}
                      style={{
                        width: '100%',
                        height: 600,
                        borderRadius: 8,
                        backgroundColor: '#111',
                      }}
                      resizeMode="cover"
                    />
                  )}
                </View>
              )}
            />

            {/* ====== Description & Actions ====== */}
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 20,
              }}
              showsVerticalScrollIndicator={false}>
              {renderTextWithLinks(selectedPost.desc || 'No description', {
                linkColor: '#4da6ff',
                textStyle: {color: 'white', fontSize: 16, marginBottom: 16},
              })}

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
                    style={{height: 24, width: 24, tintColor: '#fff'}}
                  />
                  <CustomText style={{color: 'white'}}>
                    {selectedPost.commentCount}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
