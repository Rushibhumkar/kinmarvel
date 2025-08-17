import React, {useState} from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video from 'react-native-video';
import Carousel from 'react-native-reanimated-carousel';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const H_MARGIN = 12; // card marginHorizontal
const CARD_PADDING = 12; // card padding left/right
const ITEM_WIDTH = SCREEN_WIDTH - H_MARGIN * 2 - CARD_PADDING * 2;

const AVATAR_FALLBACK =
  'https://ui-avatars.com/api/?background=EEE&color=111&name=';

const formatWhen = iso => {
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

const MediaCarousel = ({items}) => {
  if (!items || items.length === 0) return null;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={styles.mediaWrap}>
      <Carousel
        width={ITEM_WIDTH}
        height={280}
        data={items}
        panGestureHandlerProps={{activeOffsetX: [-10, 10]}}
        onProgressChange={(_, absProgress) => {
          const idx = Math.round(absProgress);
          if (idx !== activeIndex) setActiveIndex(idx);
        }}
        renderItem={({item, index}) => {
          if (item?.type === 'video') {
            return (
              <Video
                source={{uri: item.url}}
                style={styles.media}
                resizeMode="cover"
                repeat
                muted={false}
                controls
                paused={activeIndex !== index}
              />
            );
          }
          return <Image source={{uri: item?.url}} style={styles.media} />;
        }}
      />
      <View style={styles.carouselDotsRow}>
        {items.map((_, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.carouselDot,
              i === activeIndex && styles.carouselDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const PostCard = ({post}) => {
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

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={{uri: avatarSrc}} style={styles.avatar} />
        <View style={{flex: 1}}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.when}>{formatWhen(post?.createdAt)}</Text>
        </View>
        <Text style={styles.visibility}>
          {post?.visible_to === 'self'
            ? '🔒'
            : post?.visible_to === 'followers'
            ? '👥'
            : '🌐'}
        </Text>
      </View>

      {/* Caption */}
      {post?.desc ? <Text style={styles.caption}>{post.desc}</Text> : null}

      {/* Location */}
      {hasLocation ? (
        <View style={styles.locationRow}>
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationText}>
            {loc?.name ? `${loc.name}` : ''}
            {loc?.name && loc?.address ? ' · ' : ''}
            {loc?.address ? `${loc.address}` : ''}
          </Text>
        </View>
      ) : null}

      {/* Media (carousel with images/videos) */}
      <MediaCarousel items={media} />

      {/* Hashtags */}
      {tags.length ? (
        <View style={styles.tagsRow}>
          {tags.map((t, i) => (
            <Text key={`${t}-${i}`} style={styles.tagText}>
              #{t}
            </Text>
          ))}
        </View>
      ) : null}

      {/* Footer actions */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.footerBtn}
          activeOpacity={0.7}
          onPress={() => console.log('like pressed', post?._id)}>
          <Text style={styles.footerBtnText}>❤ {post?.likeCount ?? 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerBtn}
          activeOpacity={0.7}
          onPress={() => console.log('comment pressed', post?._id)}>
          <Text style={styles.footerBtnText}>💬 {post?.commentCount ?? 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: H_MARGIN,
    marginBottom: 12,
    borderRadius: 14,
    padding: CARD_PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  name: {fontSize: 15.5, fontWeight: '600', color: '#111'},
  when: {fontSize: 12, color: '#888'},
  visibility: {fontSize: 16, color: '#666', marginLeft: 8},
  caption: {fontSize: 15, color: '#222', lineHeight: 21, marginBottom: 8},
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationPin: {fontSize: 14, marginRight: 4},
  locationText: {fontSize: 13.5, color: '#444', flexShrink: 1},

  mediaWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    alignSelf: 'center',
  },
  media: {
    width: ITEM_WIDTH,
    height: 280,
    backgroundColor: '#000',
  },
  carouselDotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  carouselDotActive: {
    backgroundColor: '#fff',
  },

  tagsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2},
  tagText: {color: '#3b82f6', marginRight: 8, fontSize: 13},

  footerRow: {
    flexDirection: 'row',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
    justifyContent: 'space-between',
  },
  footerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  footerBtnText: {fontSize: 14.5, color: '#111'},
});
