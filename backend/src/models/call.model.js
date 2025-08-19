import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    caller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    callee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaType: { type: String, enum: ["audio", "video"], required: true },
    status: { type: String, enum: ["missed", "rejected", "ended", "ongoing"], default: "ongoing" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    durationMs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Call = mongoose.model("Call", callSchema);
export default Call;


