import Logout from "@/components/auth/Logout";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { use } from "react";
import { toast } from "sonner";

const ChatAppPage = () => {
    const user = useAuthStore(s => s.user);
    const handleOnClick = async () => {
        try {
            await api.get("/users/test", {withCredentials: true});
            toast.success("API call successful!");
        }
        catch (error) {
            toast.error("Failed to fetch user info. Please try again.");
            console.error(error);
        }
    }
    return (
        <div>
            {user?.username}
            <Logout />
            <Button onClick={handleOnClick}>Test API Call</Button>
        </div>
    )
};

export default ChatAppPage;