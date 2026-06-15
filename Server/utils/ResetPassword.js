const sendPasswordResetWebhook = async (payload) => {
  const webhookUrl = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("N8N_PASSWORD_RESET_WEBHOOK_URL is missing. Password reset automation skipped.");
    return null;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`n8n password reset webhook failed with status ${response.status}`);
      return null;
    }

    return response;
  } catch (error) {
    console.error("n8n password reset webhook error:", error.message);
    return null;
  }
};

export const resetpassword = async (email, resetLink, details = {}) => {
  const {
    name = "Account holder",
    role = "account",
    requestedAt = new Date(),
  } = details;

  return sendPasswordResetWebhook({
    event: "password.reset.requested",
    accountName: name,
    accountEmail: email,
    accountRole: role,
    resetLink,
    requestedAt,
    expiresInMinutes: 15,
    appUrl: (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim(),
  });
};
