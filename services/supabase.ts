import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = "https://xzanpadwkokvgvzrzaah.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YW5wYWR3a29rdmd2enJ6YWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzM3OTEsImV4cCI6MjA3ODMwOTc5MX0.zFEnLRvlWo7vb3O8-o9nlcuL4rGRWxjbwNMeOA2gJII";

console.log("🔧 Initializing Supabase client...");
console.log("📍 Supabase URL:", supabaseUrl);
console.log("🔑 API Key exists:", !!supabaseAnonKey);

const storage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => {
          if (typeof window !== "undefined") {
            return Promise.resolve(localStorage.getItem(key));
          }
          return Promise.resolve(null);
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== "undefined") {
            localStorage.setItem(key, value);
          }
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof window !== "undefined") {
            localStorage.removeItem(key);
          }
          return Promise.resolve();
        },
      }
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log("✅ Supabase client initialized");
