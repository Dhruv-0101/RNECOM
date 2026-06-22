import User from "../model/User.js";

/**
 * Send push notifications using Expo Push API
 * @param {Array} messages - Array of Expo message objects
 */
export const sendPushNotifications = async (messages) => {
  if (!messages || messages.length === 0) return;

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("Expo push notification API errors:", result.errors);
      return;
    }

    const tickets = result.data || [];
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === "error") {
        console.error(`Error sending push notification to token ${messages[i].to}: ${ticket.message}`);
        // Handle invalid token cleanup
        if (ticket.details?.error === "DeviceNotRegistered" || (ticket.message && ticket.message.includes("DeviceNotRegistered"))) {
          const badToken = messages[i].to;
          await User.updateMany(
            { pushTokens: badToken },
            { $pull: { pushTokens: badToken } }
          );
          console.log(`Cleaned up inactive/invalid token from database: ${badToken}`);
        }
      }
    }
  } catch (error) {
    console.error("Failed to send push notifications via Expo API:", error);
  }
};

/**
 * Send notification to a specific user
 * @param {string} userId - User ID
 * @param {object} payload - { title, body, data }
 */
export const sendNotificationToUser = async (userId, { title, body, data }) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return;
    }

    const messages = user.pushTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

    await sendPushNotifications(messages);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
};

/**
 * Send notification to all users
 * @param {object} payload - { title, body, data }
 */
export const sendNotificationToAllUsers = async ({ title, body, data }) => {
  try {
    const users = await User.find({ pushTokens: { $exists: true, $ne: [] } });
    const messages = [];

    for (const user of users) {
      for (const token of user.pushTokens) {
        messages.push({
          to: token,
          sound: "default",
          title,
          body,
          data,
        });
      }
    }

    if (messages.length === 0) {
      console.log("No users with push tokens found");
      return;
    }

    // Expo recommends chunking messages to maximum of 100 per request
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await sendPushNotifications(chunk);
    }
  } catch (error) {
    console.error("Error sending notification to all users:", error);
  }
};
