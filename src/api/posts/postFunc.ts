import {API_AXIOS} from '../axiosInstance';

// -----------------------------
// Types
// -----------------------------
export type VisibleTo = 'self' | 'public' | 'followers';

export type PostFile = File; // In RN, this can be { uri, type, name } too.

export interface CreatePostPayload {
  type: 'post' | 'reel';
  desc?: string;
  location?: {
    latitude: string;
    longitude: string;
    name?: string;
    address?: string;
  };
  files?: PostFile[];
  visible_to: VisibleTo;
}

export interface FetchPostsParams {
  limit?: number; // default 10
  page?: number; // default 1
  type?: 'post' | 'reel'; // default 'post'
  forceRefresh?: boolean; // bypass cache
}

type CachedEntry<T> = {
  data: T;
  ts: number;
};

const POSTS_CACHE = new Map<string, CachedEntry<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_TYPE: 'post' | 'reel' = 'post';

// -----------------------------
// 1) Create/Add Post (multipart)
// -----------------------------
export const createPost = async (postData: CreatePostPayload) => {
  try {
    const formData = new FormData();
    formData.append('type', postData.type);
    if (postData.desc) formData.append('desc', postData.desc);
    if (postData.location) {
      formData.append('location', JSON.stringify(postData.location));
    }
    if (postData.files && postData.files.length > 0) {
      postData.files.forEach(file => {
        formData.append('files', file as any);
      });
    }
    formData.append('visible_to', postData.visible_to);

    const {data} = await API_AXIOS.post('/post', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });

    // Optional: invalidate the first-page cache for this type so next read is fresh
    invalidatePostsCache({page: 1, limit: DEFAULT_LIMIT, type: postData.type});

    return data;
  } catch (error: any) {
    console.error('Error creating post:', error?.response || error);
    throw error;
  }
};

// -----------------------------
// 2) Fetch Posts (GET /post?limit=&page=&type=)
//    with simple in-memory cache
// -----------------------------
export const fetchPosts = async (params: FetchPostsParams = {}) => {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const page = params.page ?? DEFAULT_PAGE;
  const type = params.type ?? DEFAULT_TYPE;
  const forceRefresh = !!params.forceRefresh;

  const key = cacheKey({limit, page, type});

  // Serve from cache if valid
  if (!forceRefresh) {
    const cached = POSTS_CACHE.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Fetch from API
  const {data} = await API_AXIOS.get('/post', {
    params: {limit, page, type},
  });

  // Keep only up to `limit` items cached for that key
  const trimmed = Array.isArray(data?.data)
    ? {
        ...data,
        data: data.data.slice(0, limit),
      }
    : data;

  POSTS_CACHE.set(key, {data: trimmed, ts: Date.now()});

  // Optional LRU-ish cleanup to keep cache from growing unbounded
  trimCacheSize(20); // keep at most 20 distinct queries in memory

  return trimmed;
};

// -----------------------------
// 3) Warm (preload) cache with 10 posts for first page
// -----------------------------
export const warmPostsCache = async (type: 'post' | 'reel' = 'post') => {
  try {
    const key = cacheKey({limit: DEFAULT_LIMIT, page: DEFAULT_PAGE, type});
    const existing = POSTS_CACHE.get(key);
    if (existing && Date.now() - existing.ts < CACHE_TTL_MS) return; // already warm & fresh
    const {data} = await API_AXIOS.get('/post', {
      params: {limit: DEFAULT_LIMIT, page: DEFAULT_PAGE, type},
    });
    const trimmed = Array.isArray(data?.data)
      ? {
          ...data,
          data: data.data.slice(0, DEFAULT_LIMIT),
        }
      : data;
    POSTS_CACHE.set(key, {data: trimmed, ts: Date.now()});
  } catch (e) {
    // Warming is best-effort; don't throw
    console.log('[posts] warm cache failed:', e);
  }
};

// -----------------------------
// 4) Cache helpers
// -----------------------------
const cacheKey = (p: {limit: number; page: number; type: 'post' | 'reel'}) =>
  `limit=${p.limit}|page=${p.page}|type=${p.type}`;

const trimCacheSize = (maxEntries: number) => {
  if (POSTS_CACHE.size <= maxEntries) return;
  // delete oldest entries
  const entries = Array.from(POSTS_CACHE.entries()).sort(
    (a, b) => a[1].ts - b[1].ts,
  );
  const toDelete = entries.length - maxEntries;
  for (let i = 0; i < toDelete; i++) {
    POSTS_CACHE.delete(entries[i][0]);
  }
};

export type LikeAction = 'like' | 'unlike';

export const likePost = async (postId: string, action: LikeAction) => {
  const {data} = await API_AXIOS.post(`/post/${postId}/like`, {action});
  return data;
};

export const togglePostLike = async (postId: string, isLikedByMe?: boolean) => {
  const action: LikeAction = isLikedByMe ? 'unlike' : 'like';
  return likePost(postId, action);
};

export const invalidatePostsCache = (
  p?: Partial<{limit: number; page: number; type: 'post' | 'reel'}>,
) => {
  if (!p) {
    POSTS_CACHE.clear();
    return;
  }
  // Invalidate specific match(es)
  const limit = p.limit ?? DEFAULT_LIMIT;
  const page = p.page ?? DEFAULT_PAGE;
  const type = p.type ?? DEFAULT_TYPE;

  const key = cacheKey({limit, page, type});
  POSTS_CACHE.delete(key);
};

// Kick off a best-effort warm of the default first page (10 posts)
void warmPostsCache('post');
