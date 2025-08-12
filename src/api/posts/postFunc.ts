import {API_AXIOS} from '../axiosInstance';

// -----------------------------
// 1. Create/Add Post
// -----------------------------
export const createPost = async (postData: {
  type: 'post' | 'reel';
  desc?: string;
  location?: {
    latitude: string;
    longitude: string;
    name?: string;
    address?: string;
  };
  files?: File[]; // images or videos
  visible_to: 'self' | 'public' | 'followers';
}) => {
  try {
    const formData = new FormData();
    formData.append('type', postData.type);
    if (postData.desc) formData.append('desc', postData.desc);
    if (postData.location) {
      formData.append('location', JSON.stringify(postData.location));
    }
    if (postData.files && postData.files.length > 0) {
      postData.files.forEach(file => {
        formData.append('files', file);
      });
    }
    formData.append('visible_to', postData.visible_to);

    const {data} = await API_AXIOS.post('/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  } catch (error: any) {
    console.error('Error creating post:', error.response || error);
    throw error;
  }
};
