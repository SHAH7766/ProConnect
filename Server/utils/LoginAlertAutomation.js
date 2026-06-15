const sendLoginAlertWebhook = async (payload) => {
  const webhookUrl = process.env.N8N_LOGIN_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("N8N_LOGIN_ALERT_WEBHOOK_URL is missing. Login alert automation skipped.");
    return null;
  }

  // Abort if n8n takes too long so login isn't blocked
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET // security header
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`n8n login alert webhook failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("n8n login alert webhook timed out");
    } else {
      console.error("n8n login alert webhook error:", error.message);
    }
    return null;
  }
};

export const sendLoginAlertAutomation = (email, details = {}) => {
  const {
    name = "Account holder",
    role = "account",
    ipAddress = "Unknown",
    userAgent = "Unknown device",
    loginAt = new Date(),
  } = details;

  // Fire-and-forget: don't await this in your login controller
  // so user login stays fast even if n8n is slow
  sendLoginAlertWebhook({
    event: "account.login",
    accountName: name,
    accountEmail: email,
    accountRole: role,
    ipAddress,
    userAgent,
    loginAt: new Date(loginAt).toISOString(), // ensure ISO format for n8n
    appUrl: (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim(),
  }).catch(() => {}); // swallow errors so they never crash login
};