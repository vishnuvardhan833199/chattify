import { Phone, Video, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { startCall } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => startCall("audio")}> <Phone size={18} /> </button>
          <button className="btn btn-ghost btn-sm" onClick={() => startCall("video")}> <Video size={18} /> </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;