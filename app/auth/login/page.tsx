"use client"

import React, { useState } from "react"; // Added React import
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoading } from "@/contexts/loading-context";
import { useLoadingNavigation } from "@/hooks/use-loading-navigation";
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading(); // Get global functions
  const { navigateWithLoading } = useLoadingNavigation(); // Navigation with loading
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for button/form
  const { toast } = useToast(); // Initialize toast

  console.log("LOGIN PAGE: Rendering, isSubmitting (local):", isSubmitting);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("%cLOGIN PAGE: --- handleLogin START ---", "color: green; font-weight: bold;");
    setError(null);
    setIsSubmitting(true);
    showLoading();
    console.log("LOGIN PAGE: setIsSubmitting(true) and showLoading() CALLED");

    let loadingHidden = false;
    const ensureHideLoading = () => {
        if (!loadingHidden) {
            console.log("%cLOGIN PAGE: Hiding loading (ensureHideLoading)", "color: orange; font-weight: bold;");
            hideLoading();
            loadingHidden = true;
        }
    };

    try {
      console.log("LOGIN PAGE: Starting async operations...");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
          console.error("LOGIN PAGE: Supabase sign in error:", signInError);
          throw signInError;
      }
      console.log("LOGIN PAGE: Supabase sign in successful");
      console.log("LOGIN PAGE: Async operations complete.");

      // On success - use navigation with loading that continues until page loads
      setIsSubmitting(false); // Reset form state
      ensureHideLoading(); // Hide the initial loading
      
      // Navigate with continued loading state
      await navigateWithLoading("/dashboard");
      console.log("LOGIN PAGE: Navigated to dashboard.");

    } catch (err: unknown) {
      console.error("Error during login in catch block:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during login.";
      setError(errorMessage);
      ensureHideLoading(); // Hide global overlay on error
      setIsSubmitting(false); // Reset local state on error
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
        ensureHideLoading(); // Final safety check
        if(isSubmitting) setIsSubmitting(false); // Ensure reset if something went wrong
        console.log("%cLOGIN PAGE: --- handleLogin END (Finally) ---", "color: green; font-weight: bold;");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to home
            </Link>
            <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">BudgetBot</span>
            </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
            <CardDescription className="text-gray-600">Sign in to your BudgetBot account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
                 <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" disabled={isSubmitting}/>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" disabled={isSubmitting}/>
                 </div>

              {error && !isSubmitting && ( // Only show error if not currently submitting
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isSubmitting} // Use local isSubmitting
              >
                 Sign In
              </Button>
            </form>
             <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign up for free
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}