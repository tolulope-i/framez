// utils/imageUpload.ts

import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';
import * as FileSystem from 'expo-file-system/legacy'; // ← LEGACY IMPORT
import { Platform } from 'react-native';

export const uploadImage = async (imageUri: string, userId: string): Promise<string> => {
  try {
    let base64: string;

    if (Platform.OS === 'web') {
      // Web: Use fetch + FileReader
      const response = await fetch(imageUri);
      const blob = await response.blob();
      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      // Mobile: Use legacy FileSystem (bypasses deprecation error)
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file not found');
      }
      base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `posts/${userId}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error: any) {
    console.error('Image upload error:', error);
    throw new Error(error.message || 'Failed to upload image');
  }
};