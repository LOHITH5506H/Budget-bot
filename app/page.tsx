import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Target, Bell, TrendingUp, Zap, Shield, Smartphone } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BudgetBot</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                Login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Sign Up Free</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            BudgetBot: Your <span className="text-emerald-600">Financial Companion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 text-pretty max-w-2xl mx-auto">
            Simplify tracking, build smart habits, and maximize your savings—all for free. Take control of your finances
            with gamified habit building and AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg">
                Sign Up for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Animated Hero Visual */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 mb-1">7-Day</div>
                <div className="text-sm text-gray-600">Spending Streak</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">₹15,000</div>
                <div className="text-sm text-gray-600">Saved This Month</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-1">85%</div>
                <div className="text-sm text-gray-600">Goal Progress</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to master your finances
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three powerful features that work together to transform your financial habits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Simplify Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Easily record expenses, categorize spending as 'needs' vs. 'wants', and see where your money goes with
                beautiful visual charts and insights.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Automate & Remind</h3>
              <p className="text-gray-600 leading-relaxed">
                Never miss a bill again. Track subscriptions, get automated email reminders, and sync due dates with
                your Google Calendar seamlessly.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Achieve Your Goals</h3>
              <p className="text-gray-600 leading-relaxed">
                Set savings goals, maintain spending streaks, and get AI-powered nudges to help you save faster and
                build lasting financial habits.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Additional Features */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for the modern user</h2>
            <p className="text-xl text-gray-600">Secure, fast, and accessible everywhere</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank-Level Security</h3>
              <p className="text-gray-600">Your financial data is protected with enterprise-grade encryption</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile-First PWA</h3>
              <p className="text-gray-600">Install on any device and use offline with full functionality</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Insights</h3>
              <p className="text-gray-600">Get personalized recommendations to optimize your spending</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to transform your financial habits?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of users who have already taken control of their finances with BudgetBot
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-4 text-lg">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">BudgetBot</span>
            </div>
            <div className="text-gray-400 text-sm">© 2025 BudgetBot. Built with ❤️ for better financial habits.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
