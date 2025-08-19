import Call from "../models/call.model.js";

export const logCallStart = async (req, res) => {
  try {
    const { to, mediaType } = req.body;
    const caller = req.user._id;
    const call = await Call.create({ caller, callee: to, mediaType, status: "ongoing" });
    res.status(201).json(call);
  } catch (e) {
    res.status(500).json({ message: "Failed to log call" });
  }
};

export const logCallEnd = async (req, res) => {
  try {
    const { callId, status } = req.body; // status: ended/rejected/missed
    const call = await Call.findById(callId);
    if (!call) return res.status(404).json({ message: "Call not found" });
    call.status = status || "ended";
    call.endedAt = new Date();
    call.durationMs = call.endedAt - (call.startedAt || call.createdAt);
    await call.save();
    res.status(200).json(call);
  } catch (e) {
    res.status(500).json({ message: "Failed to end call" });
  }
};

export const getMyCallHistory = async (req, res) => {
  try {
    const myId = req.user._id;
    const calls = await Call.find({ $or: [{ caller: myId }, { callee: myId }] })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.status(200).json(calls);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch call history" });
  }
};


