// import "dotenv/config";
// import { Agent, run, tool } from "@openai/agents";
// import axios from "axios";
// import nodemailer from "nodemailer";

// // --- Tool 1: Get Weather ---
// const getWeatherTool = tool({
//   name: "getWeather",
//   description: "Get the current weather for a given city",
//   parameters: {
//     type: "object",
//     properties: {
//       city: { type: "string", description: "The city to get the weather for" },
//     },
//     required: ["city"],
//   },
//   execute: async ({ city }: { city: string }) => {
//     const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`;
//     const response = await axios.get(url, { responseType: "text" });
//     return `The current weather in ${city} is ${response.data.trim()}.`;
//   },
// });

// // --- Tool 2: Send Email ---
// const sendEmailTool = tool({
//   name: "sendEmail",
//   description: "Send an email to a specified recipient",
//   parameters: {
//     type: "object",
//     properties: {
//       toEmail: { type: "string", description: "Recipient email address" },
//       subject: { type: "string", description: "Email subject" },
//       body: { type: "string", description: "Email body" },
//     },
//     required: ["toEmail", "subject", "body"],
//   },
//   execute: async ({
//     toEmail,
//     subject,
//     body,
//   }: {
//     toEmail: string;
//     subject: string;
//     body: string;
//   }) => {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     try {
//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: toEmail,
//         subject,
//         text: body,
//       });
//       return `Email successfully sent to ${toEmail}`;
//     } catch (error) {
//       console.error(error);
//       return `Failed to send email`;
//     }
//   },
// });

// // --- Create OpenRouter Agent ---
// const agent = new Agent({
//   name: "WeatherEmailAgent",
//   instructions: `
// You are an AI assistant that fetches weather and sends emails.

// Rules:
// 1. If the user asks about weather, always use getWeatherTool first.
// 2. If the user wants weather sent via email, first get the weather then call sendEmailTool.
// 3. Include weather info in the email body.
// 4. Always provide a motivational thought in your reply.
// `,
//   model: "openrouter/anthropic/claude-opus-4.5", // OpenRouter model
//   tools: [getWeatherTool, sendEmailTool],
// });

// // --- Run Agent ---
// const main = async () => {
//   const query =
//     "Get the current weather in Delhi and send it to ram@gmail.com. Also give a motivational thought.";

//   const result = await run(agent, query);

//   console.log("\n--- Agent Final Output ---\n");
//   console.log(result.finalOutput);
// };

// main();

import "dotenv/config";
import OpenAI from "openai";
import axios from "axios";
import nodemailer from "nodemailer";

// --- Initialize OpenRouter client ---
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// --- Get Weather Function ---
async function getWeather(city: string) {
  const url = `https://wttr.in/${city.toLowerCase()}?format=%C+%t`;
  const response = await axios.get(url, { responseType: "text" });
  return `The current weather in ${city} is ${response.data.trim()}.`;
}

// --- Send Email Function ---
async function sendEmail(toEmail: string, subject: string, body: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject,
      text: body,
    });
    return `Email successfully sent to ${toEmail}`;
  } catch (error) {
    console.error(error);
    return `Failed to send email`;
  }
}

// --- Main function ---
async function main() {
  // User input
  const userQuery =
    "Get the current weather in Delhi and send it to ram@gmail.com. Also give a motivational thought.";

  // Step 1: Ask OpenRouter for instructions
  const completion = await client.chat.completions.create({
    model: "anthropic/claude-opus-4.5",
    messages: [
      {
        role: "user",
        content: userQuery,
      },
    ],
    max_tokens: 300,
  });

  const modelOutput = completion.choices[0].message.content;
  console.log("\n--- Model Output ---\n");
  console.log(modelOutput);

  // Step 2: Parse model output for city and email (simple regex example)
  const cityMatch = userQuery.match(/weather in (\w+)/i);
  const emailMatch = userQuery.match(/send it to ([\w.@]+)/i);

  let weatherInfo = "";
  if (cityMatch) {
    const city = cityMatch[1];
    weatherInfo = await getWeather(city);
    console.log("\n--- Weather Info ---\n", weatherInfo);
  }

  if (emailMatch) {
    const toEmail = emailMatch[1];
    const emailBody = `${weatherInfo}\n\nMotivational thought: "Keep pushing forward and believe in yourself!"`;
    const emailResult = await sendEmail(
      toEmail,
      "Weather Update + Motivation",
      emailBody,
    );
    console.log("\n--- Email Result ---\n", emailResult);
  }
}

main();
