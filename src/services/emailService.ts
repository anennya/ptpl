export const sendEmail = async ({ to, subject, html }) => {
  // Implement your email sending logic here
  // You could use services like SendGrid, Mailgun, etc.

  // Example with fetch API:
  const response = await fetch("https://api.youremailservice.com/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send email");
  }

  return await response.json();
};
