export const sendAdminAlert = async (reportType, workId, reporter, target, description) => {
  // Check if a Webhook URL is set in environment variables. 
  // VITE_ADMIN_WEBHOOK_URL could be a Discord, Slack, or Telegram bot webhook.
  const webhookUrl = import.meta.env.VITE_ADMIN_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn("No webhook URL configured. Skipping instant alert.");
    return;
  }

  const message = `🚨 **New ${reportType === 'NoShow' ? 'No-Show Report' : 'Worker Dispute'} Filed!**\n\n` +
                  `**Work ID:** ${workId}\n` +
                  `**Reporter:** ${reporter}\n` +
                  `**Target:** ${target}\n` +
                  `**Details:** ${description || 'N/A'}\n\n` +
                  `*Log in to the Admin Portal to review.*`;

  try {
    // Basic Discord/Slack compatible payload
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: message, // For Discord
        text: message // For Slack/Telegram
      })
    });
  } catch (error) {
    console.error("Failed to send webhook alert:", error);
  }
};
