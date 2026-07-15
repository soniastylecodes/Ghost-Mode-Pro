import { config } from "dotenv";
config();

const API_KEY = process.env.ABACUS_API_KEY;
const BASE_URL = process.env.ABACUS_LLM_BASE_URL || "https://routellm.abacus.ai/v1";
const MODEL = process.env.ABACUS_LLM_MODEL || "deepseek-ai/DeepSeek-V4-Pro";

async function testAI() {
  console.log("Testing AI Connection...");
  console.log({ API_KEY: API_KEY ? "Set" : "Not Set", BASE_URL, MODEL });

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "user", content: "Say 'DeepSeek API is alive and kicking' if you can read this." },
      ],
    }),
  });

  if (!res.ok) {
    console.error("FAILED", await res.text());
    return;
  }

  const data = await res.json();
  console.log("SUCCESS! Response:");
  console.log(data?.choices?.[0]?.message?.content);
}

testAI().catch(console.error);
