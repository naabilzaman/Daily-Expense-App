
import { GoogleGenAI } from "@google/genai";
import { Transaction, FinancialStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFinancialTips(transactions: Transaction[], stats: FinancialStats) {
  try {
    const recentTransactions = transactions.slice(0, 5).map(t => `${t.date}: ${t.type} of $${t.amount} in ${t.category}`).join(', ');
    
    const prompt = `
      Act as a high-end financial advisor. Given the user's current financial status:
      - Total Income: $${stats.totalIncome}
      - Total Expense: $${stats.totalExpense}
      - Current Balance: $${stats.balance}
      - Recent Activity: ${recentTransactions}
      
      Provide 3 concise, highly actionable financial tips for this user.
      Keep it professional yet encouraging. Format as a bulleted list.
      If expenses are > 80% of income, add a serious but constructive warning.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "Keep tracking your expenses to see detailed AI insights here!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Start adding transactions to get AI-powered financial advice.";
  }
}
