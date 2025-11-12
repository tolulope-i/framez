import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const uploadImage = async (imageUri: string, userId: string): Promise<string> => {
  try {
    let base64: string;

    if (Platform.OS === 'web') {
      // Web implementation
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(blob);
      });
    } else {
      // Mobile implementation
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Image file not found');
      }

      base64 = await FileSystem.readAsStringAsync(imageUri, {
  encoding: 'base64', 
});

    }

    const fileName = `posts/${userId}_${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image');
  }
};