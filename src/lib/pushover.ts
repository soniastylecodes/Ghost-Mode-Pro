import { prisma } from "./prisma";

export async function sendPushoverNotification(
  userId: string,
  message: string,
  title?: string,
  priority: number = 0,
  url?: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        goals: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      console.log(`Pushover: User ${userId} not found.`);
      return;
    }

    // Prefer admin-configured token, fall back to env var
    const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    const appToken = settings?.pushoverAppToken || process.env.PUSHOVER_APP_TOKEN || "a2746rakwd21oeq7hyxbagzs3c4xuy";
    const userKey = user.pushoverUserKey || "uv535wcgrdgr2kjotfviwr5zi5tag4";

    const activeGoal = user.goals[0];
    const name = user.name || "Operator";
    let formattedMessage = message;

    if (activeGoal) {
      const msLeft = activeGoal.deadline.getTime() - Date.now();
      const daysRemaining = Math.max(0, Math.ceil(msLeft / 86400000));
      const goalTitle = activeGoal.title;
      formattedMessage = `${name}. ${daysRemaining} days to ${goalTitle}. ${message}`;
    }

    const finalTitle = title ?? "Ghost Mode";

    if (!appToken || !userKey) {
      console.log(
        `[PUSHOVER DEV LOG] User: ${user.email} | Title: ${finalTitle} | Msg: ${formattedMessage}`
      );
      await prisma.notificationLog.create({
        data: {
          userId,
          message: formattedMessage,
          title: finalTitle,
          priority,
          status: "logged_only",
        },
      });
      return;
    }

    const res = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: appToken,
        user: userKey,
        message: formattedMessage,
        title: finalTitle,
        priority,
        url,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Pushover send failed:", errText);
      await prisma.notificationLog.create({
        data: {
          userId,
          message: formattedMessage,
          title: finalTitle,
          priority,
          status: `failed: ${errText.slice(0, 100)}`,
        },
      });
    } else {
      await prisma.notificationLog.create({
        data: {
          userId,
          message: formattedMessage,
          title: finalTitle,
          priority,
          status: "sent",
        },
      });
    }
  } catch (err) {
    console.error("sendPushoverNotification error:", err);
  }
}
