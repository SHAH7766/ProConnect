const sendLoginAlertWebhook = async (payload) => {
  const webhookUrl = process.env.N8N_LOGIN_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("N8N_LOGIN_ALERT_WEBHOOK_URL is missing. Login alert automation skipped.");
    return null;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n login alert webhook failed with status ${response.status}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error("n8n login alert webhook error:", error.message);
    return null;
  }
};

export const sendLoginAlertAutomation = async (email, details = {}) => {
  const {
    name = "Account holder",
    role = "account",
    ipAddress = "Unknown",
    userAgent = "Unknown device",
    loginAt = new Date(),
  } = details;

  return sendLoginAlertWebhook({
    event: "account.login",
    accountName: name,
    accountEmail: email,
    accountRole: role,
    ipAddress,
    userAgent,
    loginAt,
    appUrl: (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim(),
  });
};
