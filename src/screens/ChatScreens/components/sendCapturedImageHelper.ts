// components/sendCapturedImageHelper.ts
import RNFS from 'react-native-fs';
import {API_AXIOS} from '../../../api/axiosInstance';
import {myConsole} from '../../../utils/myConsole';

type Attachment = {
  path: string;
  size: string;
  mimeType: string;
  fileName: string;
};

export const sendCapturedImageHelper = async ({
  uri,
  onSuccess,
  onError,
  toast, // pass toast from the screen; DO NOT use hooks here
}: {
  uri: string;
  onSuccess: (fileData: {attachments: Attachment[]}) => void;
  onError?: (e?: any) => void;
  toast?: {error: (msg: string) => void; success?: (msg: string) => void};
}) => {
  try {
    // Normalize URI
    const normalizedUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    const srcPath = normalizedUri.replace('file://', '');

    // Derive filename & extension
    const fileName = srcPath.split('/').pop() || `IMG_${Date.now()}.jpg`;
    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();

    // Guess mime type
    const mimeType =
      ext === 'png'
        ? 'image/png'
        : ext === 'webp'
        ? 'image/webp'
        : ext === 'heic'
        ? 'image/heic'
        : ext === 'mp4'
        ? 'video/mp4'
        : ext === 'mov'
        ? 'video/quicktime'
        : 'image/jpeg';

    // If it's already in Download directory, don't move again
    const isAlreadyInDownload = srcPath.startsWith(RNFS.DownloadDirectoryPath);
    const destPath = isAlreadyInDownload
      ? srcPath
      : `${RNFS.DownloadDirectoryPath}/${fileName}`;

    if (!isAlreadyInDownload) {
      await RNFS.moveFile(srcPath, destPath);
    } else {
      // myConsole('sendCapturedImageHelper:skipMove', {destPath});
    }

    // Try to get file size
    let sizeStr = 'unknown';
    try {
      const stat = await RNFS.stat(destPath);
      if (stat?.size != null) sizeStr = String(stat.size);
    } catch (e) {
      // myConsole('sendCapturedImageHelper:stat:error', e);
    }

    // Upload
    const finalUri = `file://${destPath}`;
    const formData = new FormData();
    formData.append('files', {
      uri: finalUri,
      type: mimeType,
      name: fileName,
    } as any);

    const {data} = await API_AXIOS.post('/file/upload', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });

    if (!data?.success || !data?.data?.files?.length) {
      toast?.error?.('Failed to upload the image.');
      onError?.(data);
      return;
    }

    const uploadedFilePath = data.data.files[0];
    const attachment: Attachment = {
      path: uploadedFilePath,
      size: sizeStr,
      mimeType,
      fileName,
    };

    const payload = {attachments: [attachment]};
    onSuccess(payload);
  } catch (error) {
    console.error('sendCapturedImageHelper:error', error);
    toast?.error?.('Error while saving or uploading the image.');
    onError?.(error);
  }
};
