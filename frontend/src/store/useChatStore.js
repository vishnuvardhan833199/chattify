import { create } from "zustand";
import toast from "react-hot-toast";
import api from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  activeCall: null, // { peerConnection, mediaType, callId, remoteUser }
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await api.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to fetch users";
      toast.error(msg);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // WebRTC 1:1 call helpers (minimal viable)
  startCall: async (mediaType) => {
    const { selectedUser } = get();
    const { socket, authUser } = useAuthStore.getState();
    if (!selectedUser || !socket) return;

    // Log call start
    const res = await api.post("/calls/start", { to: selectedUser._id, mediaType });
    const call = res.data;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mediaType === "video",
    });
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("call:ice-candidate", { to: selectedUser._id, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      // Attach e.streams[0] to remote video element in component using activeCall
      set({ activeCall: { ...get().activeCall, remoteStream: e.streams[0] } });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("call:offer", { to: selectedUser._id, offer, mediaType });

    set({ activeCall: { peerConnection: pc, mediaType, callId: call._id, remoteUser: selectedUser, localStream } });

    // Listen for answer and ICE
    socket.off("call:answer").on("call:answer", async ({ from, answer }) => {
      if (from !== selectedUser._id) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.off("call:ice-candidate").on("call:ice-candidate", async ({ from, candidate }) => {
      if (from !== selectedUser._id) return;
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    });
    socket.off("call:end").on("call:end", async ({ from }) => {
      if (from !== selectedUser._id) return;
      await get().endCall("remote-ended");
    });
  },

  answerCall: async ({ from, offer, mediaType }) => {
    const { socket } = useAuthStore.getState();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mediaType === "video",
    });
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    pc.onicecandidate = (e) => { if (e.candidate) socket.emit("call:ice-candidate", { to: from, candidate: e.candidate }); };
    pc.ontrack = (e) => set({ activeCall: { ...get().activeCall, remoteStream: e.streams[0] } });
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("call:answer", { to: from, answer });
    set({ activeCall: { peerConnection: pc, mediaType, callId: null, remoteUser: { _id: from }, localStream } });
  },

  endCall: async (reason = "ended") => {
    const { activeCall } = get();
    const { socket } = useAuthStore.getState();
    if (!activeCall) return;
    try {
      if (activeCall.callId) await api.post("/calls/end", { callId: activeCall.callId, status: reason === "remote-ended" ? "ended" : reason });
    } catch {}
    try { socket?.emit("call:end", { to: activeCall.remoteUser?._id, reason }); } catch {}
    try { activeCall.localStream?.getTracks().forEach((t) => t.stop()); } catch {}
    try { activeCall.peerConnection?.close(); } catch {}
    set({ activeCall: null });
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await api.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to fetch messages";
      toast.error(msg);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await api.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to send message";
      toast.error(msg);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.sender === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));