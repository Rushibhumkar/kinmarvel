import {API_AXIOS} from '../axiosInstance';
import {myConsole} from '../../utils/myConsole';
import {useQuery} from '@tanstack/react-query';

export const registerDevice = async (deviceToken: string, platform: string) => {
  try {
    const requestData = {
      deviceToken: deviceToken,
      platform: platform,
    };
    const {data} = await API_AXIOS.post('/notification/devices', requestData);
    // myConsole('lsdkjflkdsf', data);
    return data;
  } catch (error: any) {
    console.log('Error:', error);
    throw error?.response?.data;
  }
};

export const getNotifications = async () => {
  try {
    const {data} = await API_AXIOS.get('/notification/');
    return data;
  } catch (error: any) {
    console.log('Error:', error);
    throw error?.response?.data;
  }
};

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const hideNotification = async (notificationId: string) => {
  try {
    const {data} = await API_AXIOS.put(`/notification/hide/${notificationId}`);
    return data;
  } catch (error: any) {
    console.log('Error:', error);
    throw error?.response?.data;
  }
};
