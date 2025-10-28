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

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading(); // Get global functions
  const { navigateWithLoading } = useLoadingNavigation(); // Navigation with loading
  const [isSubmitting, setIsSubmitting] = useState(false); // Local state for button/form
  const { toast } = useToast(); // Initialize toast

  console.log("SIGNUP PAGE: Rendering, isSubmitting (local):", isSubmitting);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    console.log("%cSIGNUP PAGE: --- handleSignUp START ---", "color: green; font-weight: bold;");
    setIsSubmitting(true);
    showLoading();
    console.log("SIGNUP PAGE: setIsSubmitting(true) and showLoading() CALLED");

    let loadingHidden = false;
    const ensureHideLoading = () => {
        if (!loadingHidden) {
            console.log("%cSIGNUP PAGE: Hiding loading (ensureHideLoading)", "color: orange; font-weight: bold;");
            hideLoading();
            loadingHidden = true;
        }
    };

    try {
      console.log("SIGNUP PAGE: Starting async operations...");
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split("@")[0] } },
      });
      if (signUpError) {
          console.error("SIGNUP PAGE: Supabase sign up error:", signUpError);
          throw signUpError;
      }
      console.log("SIGNUP PAGE: Supabase sign up successful");
      console.log("SIGNUP PAGE: Async operations complete.");

      // On success - use navigation with loading that continues until page loads
      setIsSubmitting(false); // Reset form state
      ensureHideLoading(); // Hide the initial loading
      
      // Navigate with continued loading state
      await navigateWithLoading("/dashboard");
      console.log("SIGNUP PAGE: Navigated to dashboard.");

    } catch (err: unknown) {
       console.error("Error during sign up in catch block:", err);
       const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during sign up.";
       setError(errorMessage);
       ensureHideLoading(); // Hide global overlay on error
       setIsSubmitting(false); // Reset local state on error
       toast({ title: "Sign Up Failed", description: errorMessage, variant: "destructive" });
    } finally {
        ensureHideLoading(); // Final safety check
        if(isSubmitting) setIsSubmitting(false);
        console.log("%cSIGNUP PAGE: --- handleSignUp END (Finally) ---", "color: green; font-weight: bold;");
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
            <CardTitle className="text-2xl font-bold text-gray-900">Create your account</CardTitle>
            <CardDescription className="text-gray-600">Start your journey to better financial habits</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-displayName">Display Name (Optional)</Label>
                <Input id="signup-displayName" type="text" placeholder="How should we call you?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-11" disabled={isSubmitting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" disabled={isSubmitting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" placeholder="Create a password (min. 6 characters)" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" disabled={isSubmitting}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirmPassword">Confirm Password</Label>
                <Input id="signup-confirmPassword" type="password" placeholder="Confirm your password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" disabled={isSubmitting}/>
              </div>
              {error && !isSubmitting && ( // Only show error if not currently submitting
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isSubmitting} // Use local isSubmitting
              >
                 Create Account
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}