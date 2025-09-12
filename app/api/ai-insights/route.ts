import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthStr = nextMonth.toISOString().split("T")[0]

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(`
        amount,
        is_need,
        description,
        categories (name)
      `)
      .eq("user_id", userId)
      .gte("expense_date", `${currentMonth}-01`)
      .lt("expense_date", nextMonthStr)
      .order("expense_date", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[v0] Database query error:", error)
      return NextResponse.json({
        insight: "Unable to fetch spending data. Start tracking your expenses to get personalized insights!",
      })
    }

    if (!expenses || expenses.length === 0) {
      return NextResponse.json({
        insight: "Start tracking your expenses to get personalized financial insights and tips!",
      })
    }

    // Calculate spending patterns
    const totalSpent = expenses.reduce((sum, exp) => sum + Number.parseFloat(exp.amount), 0)
    const wantSpending = expenses
      .filter((exp) => !exp.is_need)
      .reduce((sum, exp) => sum + Number.parseFloat(exp.amount), 0)
    const needSpending = totalSpent - wantSpending
    const wantPercentage = (wantSpending / totalSpent) * 100

    // Fetch savings goals
    const { data: goals } = await supabase
      .from("savings_goals")
      .select("name, target_amount, current_amount")
      .eq("user_id", userId)
      .eq("is_active", true)

    // Create context for Gemini API
    const spendingContext = {
      totalSpent,
      needSpending,
      wantSpending,
      wantPercentage,
      transactionCount: expenses.length,
      topCategories: expenses.reduce((acc: any, exp) => {
        const category = exp.categories?.name || "Other"
        acc[category] = (acc[category] || 0) + Number.parseFloat(exp.amount)
        return acc
      }, {}),
      goals: goals || [],
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log("[v0] Gemini API key not found, using fallback insights")
      const fallbackInsights = [
        `You've spent ₹${totalSpent.toLocaleString()} this month with ${wantPercentage.toFixed(0)}% on wants. Try to keep wants under 30% for better savings!`,
        `Great job tracking ${expenses.length} transactions this month! Consider setting a monthly budget of ₹${Math.round(totalSpent * 1.1)} to stay on track.`,
        `Your need vs want ratio is ${((needSpending / totalSpent) * 100).toFixed(0)}:${wantPercentage.toFixed(0)}. Aim for 70:30 to optimize your savings potential.`,
        `You're building excellent financial habits! Consider automating ₹${Math.round(wantSpending * 0.2)} monthly to your savings goals.`,
        `Track daily to maintain momentum. Your current spending pattern shows room to save ₹${Math.round(wantSpending * 0.15)} monthly.`,
      ]

      const randomInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)]
      return NextResponse.json({ insight: randomInsight })
    }

    // Call Gemini API for personalized insights
    console.log("[v0] Making Gemini API request...")

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `As a personal finance advisor, provide a brief, actionable insight (max 2 sentences) based on this spending data:

Total spent this month: ₹${totalSpent}
Needs: ₹${needSpending} (${((needSpending / totalSpent) * 100).toFixed(0)}%)
Wants: ₹${wantSpending} (${wantPercentage.toFixed(0)}%)
Transactions: ${expenses.length}
Top spending categories: ${Object.entries(spendingContext.topCategories)
                    .slice(0, 3)
                    .map(([cat, amt]) => `${cat}: ₹${amt}`)
                    .join(", ")}
Active savings goals: ${goals?.length || 0}

Give specific, actionable advice to improve their financial habits. Use Indian Rupee (₹) format. Be encouraging but practical.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 200,
          },
        }),
      },
    )

    console.log("[v0] Gemini API response status:", geminiResponse.status)

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error("[v0] Gemini API error response:", errorText)
      throw new Error(`Gemini API request failed: ${geminiResponse.status} - ${errorText}`)
    }

    const geminiData = await geminiResponse.json()
    console.log("[v0] Gemini API response data:", JSON.stringify(geminiData, null, 2))

    const insight =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      `You've spent ₹${totalSpent.toLocaleString()} this month with ${wantPercentage.toFixed(0)}% on wants. Consider reducing want spending to boost your savings!`

    console.log("[v0] Generated insight:", insight)
    return NextResponse.json({ insight })
  } catch (error) {
    console.error("AI Insights API error:", error)

    // Fallback insights if Gemini API fails
    const fallbackInsights = [
      "Track your expenses daily to build better financial awareness and control.",
      "Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      "Set up automatic transfers to your savings goals to build wealth consistently.",
      "Review your subscriptions monthly and cancel unused services to save money.",
      "Use the envelope method to control spending in problem categories.",
    ]

    const randomInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)]

    return NextResponse.json({ insight: randomInsight })
  }
}
