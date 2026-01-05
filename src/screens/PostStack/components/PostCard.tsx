import React, {useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Video from 'react-native-video';
import {myConsole} from '../../../utils/myConsole';
import {useNavigation} from '@react-navigation/native';
import {renderTextWithLinks} from '../../../utils/renderTextWithLinks';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const H_MARGIN = 16;
const CARD_PADDING = 16;
const ITEM_WIDTH = SCREEN_WIDTH - H_MARGIN * 2;

const AVATAR_FALLBACK =
  'https://ui-avatars.com/api/?background=EEE&color=111&name=';

const formatWhen = (iso: any) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toDateString().slice(4);
};

const CustomCarousel = ({items, onDoubleTap}: any) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Default muted
  const flatListRef = useRef<FlatList>(null);
  const lastTapRef = useRef<number>(0);
  const videoRefs = useRef<Array<any>>([]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / ITEM_WIDTH);
    setActiveIndex(index);

    // Pause all other videos when scrolling
    videoRefs.current.forEach((ref, i) => {
      if (ref && i !== index && items[i]?.type === 'video') {
        try {
          ref.seek(0); // Reset to beginning
        } catch (e) {}
      }
    });
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTap?.();
    }
    lastTapRef.current = now;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const setVideoRef = (ref: any, index: number) => {
    videoRefs.current[index] = ref;
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[activeIndex];
  const isVideo = currentItem?.type === 'video';

  return (
    <View style={styles.carouselContainer}>
      <TouchableOpacity activeOpacity={1} onPress={handleTap}>
        <FlatList
          ref={flatListRef}
          data={items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({item, index}) => {
            if (item?.type === 'video') {
              return (
                <View style={styles.mediaItem}>
                  <Video
                    ref={ref => setVideoRef(ref, index)}
                    source={{uri: item.url}}
                    style={styles.media}
                    resizeMode="cover"
                    repeat
                    muted={isMuted || activeIndex !== index}
                    controls={false} // Hide default controls
                    paused={activeIndex !== index}
                    onLoad={() => {
                      // Auto-play when loaded
                      if (activeIndex === index) {
                        // Video is ready
                      }
                    }}
                  />
                </View>
              );
            }
            return (
              <View style={styles.mediaItem}>
                <Image source={{uri: item?.url}} style={styles.media} />
              </View>
            );
          }}
          keyExtractor={(item, index) => index.toString()}
        />
      </TouchableOpacity>

      {/* Mute/Unmute Button - Only for video */}
      {isVideo && (
        <TouchableOpacity
          style={styles.muteButton}
          onPress={toggleMute}
          activeOpacity={0.7}>
          <Text style={styles.muteButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      )}

      {items.length > 1 && (
        <View style={styles.paginationContainer}>
          {items.map((_: any, index: number) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};
const PostCard = ({post, onOpenComments, onLikePress}: any) => {
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();
  const author = post?.createdBy || {};
  const name =
    author?.fullName ||
    `${author?.firstName || ''} ${author?.lastName || ''}`.trim() ||
    'User';
  const avatarSrc =
    author?.profileImageUrl || `${AVATAR_FALLBACK}${encodeURIComponent(name)}`;

  const media = Array.isArray(post?.media) ? post.media : [];
  const loc = post?.location;
  const hasLocation = !!(loc?.name || loc?.address);
  const tags = Array.isArray(post?.hashTags) ? post.hashTags : [];

  const handleDoubleTap = () => {
    if (!post?.isLikedByMe) {
      onLikePress?.(post, 'like');
    }
  };

  const normalizedDesc = (post?.desc || '').replace(/\n{3,}/g, '\n\n').trim();

  const isLongText =
    normalizedDesc.split('\n').length > 3 || normalizedDesc.length > 20;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{uri: avatarSrc}} style={styles.avatar} />
        <View style={styles.userInfo}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('UsersProfileDetails', {
                id: post?.createdBy?._id,
                showBasicDetails: true,
              })
            }>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.timeLocation}>
              <Text style={styles.when}>{formatWhen(post?.createdAt)}</Text>
              {hasLocation && <Text style={styles.locationDot}>•</Text>}
              {hasLocation && (
                <Text style={styles.locationMini}>
                  {loc?.name || loc?.address}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.visibilityContainer}>
          <Text style={styles.visibility}>
            {post?.visible_to === 'self'
              ? '🔒 Private'
              : post?.visible_to === 'followers'
              ? '👥 Followers'
              : '🌐 Public'}
          </Text>
        </View>
      </View>

      {post?.desc && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded(p => !p)}
          style={styles.captionContainer}>
          <Text
            style={styles.caption}
            numberOfLines={expanded ? undefined : 3}
            ellipsizeMode="tail">
            {renderTextWithLinks(normalizedDesc, {
              linkColor: '#667eea',
              isClickable: true,
            })}
          </Text>
          {isLongText && (
            <Text style={styles.moreText}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      <CustomCarousel items={media} onDoubleTap={handleDoubleTap} />

      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <FlatList
            data={tags}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <TouchableOpacity style={styles.tagItem}>
                <Text style={styles.tagText}>#{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `${item}-${index}`}
          />
        </View>
      )}

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statButton}
          onPress={() => onLikePress?.(post)}>
          <Text
            style={[styles.statIcon, post?.isLikedByMe && styles.likedIcon]}>
            {post?.isLikedByMe ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.statText}>{post?.likeCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statButton}
          onPress={() => {
            onOpenComments?.(post);
          }}>
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statText}>{post?.commentCount || 0}</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.statButton}>
          <Text style={styles.statIcon}>🔄</Text>
          <Text style={styles.statText}>{post?.shareCount || 0}</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: H_MARGIN,
    marginBottom: 16,
    borderRadius: 20,
    padding: 0,
    // shadowColor: '#667eea',
    // shadowOpacity: 0.08,
    // shadowRadius: 12,
    // shadowOffset: {width: 0, height: 6},
    // elevation: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CARD_PADDING,
    paddingBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#f0f2ff',
    borderWidth: 2,
    borderColor: '#667eea20',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  timeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  when: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  locationDot: {
    fontSize: 12,
    color: '#667eea',
    marginHorizontal: 4,
  },
  locationMini: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  visibilityContainer: {
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visibility: {
    fontSize: 11,
    color: '#667eea',
    fontWeight: '600',
  },
  captionContainer: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 12,
  },
  caption: {
    fontSize: 14.5,
    color: '#2d3748',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  moreText: {
    color: '#667eea',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  tagsContainer: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tagItem: {
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#667eea',
    fontSize: 12.5,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f2ff',
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 12,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  likedIcon: {
    color: '#ff4757',
  },
  statText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },

  carouselContainer: {
    position: 'relative',
    backgroundColor: '#000',
  },
  mediaItem: {
    width: ITEM_WIDTH,
    height: 450,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#ffffff',
  },
  muteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  muteButtonText: {
    fontSize: 20,
    color: '#fff',
  },
});
