export default async ({ res, log }) => {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ghost-mode-pro.appwrite.network";
  const CRON_SECRET = process.env.CRON_SECRET || "ghost_mode_cron_secret";
  const url = `${APP_URL}/api/cron/escalations?secret=${CRON_SECRET}`;
  
  log(`Fetching ${url}`);
  try {
    const response = await fetch(url);
    const data = await response.json();
    log(`Escalations response: ${JSON.stringify(data)}`);
    return res.json({ success: true, data });
  } catch (error) {
    log(`Error: ${error.message}`);
    return res.json({ success: false, error: error.message });
  }
};
