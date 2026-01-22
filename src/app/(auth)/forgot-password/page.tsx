"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("Password reset email sent!");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo & Branding */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-4 relative">
          <Image
            src="/lslogo.png"
            alt="Lelani School Logo"
            width={96}
            height={96}
            className="rounded-full"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold text-white">Lelani School</h1>
        <p className="text-primary-100 mt-2">Transport Management System</p>
      </div>

      {/* Forgot Password Form */}
      <div className="bg-surface rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-2 text-center">
          Reset Password
        </h2>
        <p className="text-gray-400 text-center mb-6">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        {sent ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-semibold mb-2">Check Your Email</h3>
            <p className="text-gray-400 mb-6">
              We&apos;ve sent a password reset link to{" "}
              <strong className="text-white">{email}</strong>
            </p>
            <Link href="/login" className="btn btn-primary">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="driver@lelani.school"
                autoComplete="email"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block py-3"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>

            <p className="text-center text-sm text-gray-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-primary-400 hover:text-primary-300"
              >
                Login
              </Link>
            </p>
          </form>
        )}
      </div>

      {/* Footer */}
      <p className="text-center mt-6 text-primary-100 text-sm">
        &copy; 2026 Lelani School. All rights reserved.
      </p>
    </div>
  );
}
