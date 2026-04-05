const ChatRequest = require("../models/ChatRequest");

const canMessageDirectly = async ({ collegeId, senderUser, receiverUser }) => {
  if (!collegeId || !senderUser || !receiverUser) {
    return { allowed: false, reason: "Invalid sender/receiver context" };
  }

  if (String(senderUser.collegeId) !== String(receiverUser.collegeId)) {
    return { allowed: false, reason: "Cross-college messaging is not allowed" };
  }

  const senderRole = senderUser.role;
  const receiverRole = receiverUser.role;
  const isSenderAdmin = senderRole === "admin" || senderRole === "collegeAdmin" || senderRole === "superAdmin";

  if (!isSenderAdmin && senderUser.directChatBlocked) {
    return { allowed: false, reason: "Your direct chat access is blocked by admin" };
  }

  if (!isSenderAdmin && receiverUser.directChatBlocked) {
    return { allowed: false, reason: "This user cannot be contacted via direct chat right now" };
  }

  if (senderRole === "student" && receiverRole === "student") {
    const accepted = await ChatRequest.findOne({
      collegeId,
      status: "accepted",
      $or: [
        { requester: senderUser._id, receiver: receiverUser._id },
        { requester: receiverUser._id, receiver: senderUser._id },
      ],
    }).select("_id");

    if (!accepted) {
      return {
        allowed: false,
        reason: "Student-to-student chat requires accepted chat request",
      };
    }
  }

  return { allowed: true };
};

module.exports = {
  canMessageDirectly,
};
