import {create } from "zustand";
import {toast} from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    clearState: () => {
        set({ accessToken: null, user: null , loading: false});
    },

    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({ loading: true });
            // call API to sign up the user
            await authService.signUp(username, password, email, firstName, lastName);

            toast.success("Sign up successful! Please sign in to continue.");
        }
        catch (error) {
            console.error(error);
            toast.error("Failed to sign up. Please try again.");
        }
        finally {
            set({ loading: false });
        }
    },

    signIn: async (username, password) => {
        try {
            set({ loading: true });
            // call API to sign in the user
            const {accessToken} = await authService.signIn(username, password);
            get().setAccessToken(accessToken);
            await get().fetchMe();
            toast.success("Sign in successful! Welcome back.");
        }
        catch (error) {
            console.error(error);
            toast.error("Failed to sign in. Please check your credentials and try again.");
        }
        finally {
            set({ loading: false });
        }
    },

    signOut: async () => {
        try {
            get().clearState();
            await authService.signOut();
            toast.success("Sign out successful! See you next time.");
        }
        catch (error) {
            console.error(error);
            toast.error("Failed to sign out. Please try again.");
        }
    },

    fetchMe: async () => {
        try {
            set({ loading: true });
            const user = await authService.fetchMe();
            set({ user });
        }
        catch (error) {
            console.error(error);
            set({ user: null, accessToken: null });
            toast.error("Failed to fetch user information. Please try again.");
        }
        finally {
            set({ loading: false });
        }
    },

    refresh: async () => {
        try {
            set({ loading: true });
            const {user, fetchMe, setAccessToken} = get();
            const newAccessToken = await authService.refresh();
            setAccessToken(newAccessToken);

            if (!user){
                await fetchMe();
            }
        }
        catch (error) {
            console.error(error);
            get().clearState();
        }
        finally {
            set({ loading: false });
        }
    },

    setAccessToken: (accessToken) => {
        set({ accessToken });
    }
}));