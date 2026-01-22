"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success("Login successful!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
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

      {/* Login Form */}
      <div className="bg-surface rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

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

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              className="form-input"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/forgot-password"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Forgot Password?
            </Link>
            <Link
              href="/register"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Create account
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block py-3 text-lg"
          >
            {loading ? (
              <>
                <span className="spinner" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center mt-6 text-primary-100 text-sm">
        &copy; 2026 Lelani School. All rights reserved.
      </p>
    </div>
  );
}
