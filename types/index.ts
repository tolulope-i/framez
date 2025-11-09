export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    created_at: string;
}

export interface Post {
    user: User | null;
    session: any;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name:string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    initialize: () => Promise<void>
}

export interface PostsState {
  posts: Post[];
  userPosts: Post[];
  loading: boolean;
  fetchPosts: () => Promise<void>;
  fetchUserPosts: (userId: string) => Promise<void>;
  createPost: (content: string, imageUri?: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  updatePost: (postId: string, content: string) => Promise<void>;
}

export interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  initializeTheme: () => Promise<void>;
}
