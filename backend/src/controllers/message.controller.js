import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// ✅ Send a message
export const sendMessage = async (req, res) => {
  try {
    const receiverId = req.params.id;
    const { text, image } = req.body;
    const senderId = req.user._id;

    if (!receiverId || (!text && !image)) {
      return res.status(400).json({ message: "Message content is required" });
    }

    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const created = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text,
      image: imageUrl,
    });

    // return lean/plain object
    const newMessage = await Message.findById(created._id).lean();

    // Emit to receiver in real-time if online
    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get conversation between two users
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userToChatId },
        { sender: userToChatId, receiver: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all users except logged-in user (for sidebar)
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "-password"
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("Get Users for Sidebar Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
