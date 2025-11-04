import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {API_AXIOS} from '../axiosInstance';

export const getAllUsers = async (searchValue = '', page = 1, limit = 10) => {
  try {
    const {data} = await API_AXIOS.get('/user/all', {
      params: {
        searchValue,
        page,
        limit,
      },
    });
    return data;
  } catch (error: any) {
    console.error('Error fetching all users:', error.response || error);
    throw error;
  }
};

export const useGetAllUsers = (searchValue = '', limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['allUsers', searchValue, limit],
    queryFn: async ({pageParam = 1}) => {
      const response = await getAllUsers(searchValue, pageParam, limit);
      return response?.data || response; // adjust based on your API structure
    },
    getNextPageParam: (lastPage, allPages) => {
      const users = lastPage?.users || [];
      if (users.length < limit) return undefined;
      return allPages.length + 1;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const getUserById = async (userId: string) => {
  try {
    const {data} = await API_AXIOS.get(`/user/${userId}`);
    return data;
  } catch (error: any) {
    console.error(`Error fetching user ${userId}:`, error.response || error);
    throw error;
  }
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: ['userById', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId, // only fetch when userId is truthy
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

// -----------------------------
// PATCH: Block / Unblock User
// -----------------------------
export const blockUser = async (userId: string) => {
  try {
    const {data} = await API_AXIOS.patch(`/user/block/${userId}`);
    return data;
  } catch (error: any) {
    console.error(`Error blocking user ${userId}:`, error.response || error);
    throw error;
  }
};

export const unblockUser = async (userId: string) => {
  try {
    const {data} = await API_AXIOS.patch(`/user/unblock/${userId}`);
    return data;
  } catch (error: any) {
    console.error(`Error unblocking user ${userId}:`, error.response || error);
    throw error;
  }
};

// -----------------------------
// POST: Check if username exists
// -----------------------------
export const checkUsernameExists = async (username: string) => {
  try {
    const {data} = await API_AXIOS.post('/auth/check-username-exists', {
      username,
    });
    return data;
  } catch (error: any) {
    console.error(
      `Error checking username ${username}:`,
      error.response || error,
    );
    throw error;
  }
};
