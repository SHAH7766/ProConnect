const sendPasswordResetWebhook = async (payload) => {
  const webhookUrl = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("N8N_PASSWORD_RESET_WEBHOOK_URL is missing. Password reset automation skipped.");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`n8n password reset webhook failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("n8n password reset webhook timed out");
    } else {
      console.error("n8n password reset webhook error:", error.message);
    }
    return null;
  }
};

export const resetpassword = (email, resetLink, details = {}) => {
  const {
    name = "Account holder",
    role = "account",
    requestedAt = new Date(),
  } = details;

  // Fire-and-forget so password reset API stays fast
  return sendPasswordResetWebhook({
    event: "password.reset.requested",
    accountName: name,
    accountEmail: email,
    accountRole: role,
    resetLink,
    requestedAt: new Date(requestedAt).toISOString(),
    expiresInMinutes: 15,
    appUrl: (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim(),
  }).catch(() => {});
};