import mongoose from "mongoose";
const Schema = mongoose.Schema;

const RefreshTokenSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // Tracks the new token that replaced this one during a rotation handshake.
    // Helps trace the token lineage chain.
    replacedBy: {
      type: String,
      default: null,
    },
    // Flags if this token has already been exchanged for a new access/refresh pair.
    // If a request attempts to reuse an 'isUsed: true' token, it indicates a replay attack.
    isUsed: {
      type: Boolean,
      default: false,
    },
    // Enables manual session invalidation (e.g. password resets, security flags).
    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshToken;
