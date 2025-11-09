export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!email.trim()) return 'Email cannot be empty';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  if (password.length > 50) return 'Password is too long';
  
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) return 'Name is required';
  if (!name.trim()) return 'Name cannot be empty';
  if (name.trim().length < 2) return 'Name must be at least 2 characters long';
  if (name.trim().length > 50) return 'Name is too long';
  
  const nameRegex = /^[a-zA-Z\s]*$/;
  if (!nameRegex.test(name.trim())) return 'Name can only contain letters and spaces';
  
  return null;
};

export const validatePostContent = (content: string): string | null => {
  if (!content.trim()) return 'Post content cannot be empty';
  if (content.trim().length > 500) return 'Post content is too long (max 500 characters)';
  return null;
};