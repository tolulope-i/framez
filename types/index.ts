export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  profile_image_url?: string;
  bio?: string;
  website?: string;
  location?: string;
  created_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  user?: User;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_saved?: boolean;
    comments?: Comment[]; 

}

export interface Comment {
  id: string;
  user_id: string;
  post_id?: string;
  content: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    profile_image_url?: string;
    created_at?: string;
  };
}

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  user?: User;
  seen?: boolean;
}

export interface AuthState {
  user: User | null;
  session: any;
  loading: boolean;
  connectionError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
verifyOTP: (email: string, token: string) => Promise<any>;  initialize: () => Promise<void>;
  clearError: () => void;
}

export interface PostsState {
  posts: Post[];
  userPosts: Post[];
  savedPosts: Post[];
  loading: boolean;
  fetchPosts: () => Promise<void>;
  fetchUserPosts: (userId: string) => Promise<void>;
  fetchSavedPosts: () => Promise<void>;
  createPost: (content: string, imageUri?: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  updatePost: (postId: string, content: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  savePost: (postId: string) => Promise<void>;
  unsavePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export interface UserState {
  users: User[];
  currentProfile: User | null;
  followers: User[];
  following: User[];
  loading: boolean;
  searchUsers: (query: string) => Promise<void>;
  fetchUserProfile: (userId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadProfileImage: (imageUri: string) => Promise<void>;
}

export interface StoriesState {
  stories: Story[];
  userStories: Story[];
  loading: boolean;
  fetchStories: () => Promise<void>;
  fetchUserStories: (userId: string) => Promise<void>;
  createStory: (imageUri: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  markStoryAsSeen: (storyId: string) => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  initializeTheme: () => Promise<void>;
}