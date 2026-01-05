import {useQuery} from '@tanstack/react-query';
import {API_AXIOS} from '../axiosInstance';
import {myConsole} from '../../utils/myConsole';

// -----------------------------
// Types
// -----------------------------
export type VisibleTo = 'self' | 'public' | 'followers';

export type PostFile = File; // In RN, can also be { uri, type, name }

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
  collaborators?: string[];
  visible_to: VisibleTo;
}

export interface FetchPostsParams {
  limit?: number; // default 10
  page?: number; // default 1
  type?: 'post' | 'reel'; // default 'post'
  isCollaborative?: boolean;
}

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
    if (postData.collaborators && postData.collaborators.length > 0) {
      formData.append('collaborators', JSON.stringify(postData.collaborators));
    }
    formData.append('visible_to', postData.visible_to);

    const {data} = await API_AXIOS.post('/post', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return data;
  } catch (error: any) {
    console.error('Error creating post:', error?.response || error);
    throw error;
  }
};

// -----------------------------
// 2) Fetch Posts (GET /post)
// -----------------------------
export const fetchPosts = async (params: FetchPostsParams = {}) => {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const page = params.page ?? DEFAULT_PAGE;
  const type = params.type ?? DEFAULT_TYPE;
  const isCollaborative = params.isCollaborative ?? undefined;

  const {data} = await API_AXIOS.get('/post', {
    params: {limit, page, type, isCollaborative},
  });

  return data;
};

// -----------------------------
// 3) Like/Unlike Post
// -----------------------------
export type LikeAction = 'like' | 'unlike';

export const likePost = async (postId: string, action: LikeAction) => {
  const {data} = await API_AXIOS.post(`/post/${postId}/like`, {action});
  return data;
};

export const togglePostLike = async (postId: string, isLikedByMe?: boolean) => {
  const action: LikeAction = isLikedByMe ? 'unlike' : 'like';
  return likePost(postId, action);
};

// -----------------------------
// 4) Get posts by a specific user
// -----------------------------
export const getUserPosts = async (
  userId: string,
  params: FetchPostsParams = {},
) => {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const page = params.page ?? DEFAULT_PAGE;
  const type = params.type ?? 'all';
  const isCollaborative = params.isCollaborative ?? undefined;

  const {data} = await API_AXIOS.get(`/post/user/${userId}`, {
    params: {limit, page, type, isCollaborative},
  });

  return data;
};

export const useGetUserPosts = (userId: string, params?: FetchPostsParams) =>
  useQuery({
    queryKey: ['postsByUser', userId, params],
    queryFn: () => getUserPosts(userId, params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

// -----------------------------
// 5) Delete Post
// -----------------------------
export const deletePost = async (postId: string) => {
  const {data} = await API_AXIOS.delete(`/post/${postId}`);
  return data;
};
