"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validatePhone = (phone: string) => {
    // Kenyan phone format: +254XXXXXXXXX
    const phoneRegex = /^\+254[0-9]{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast.error("Phone number must be in format +254XXXXXXXXX");
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (authData.user) {
        // Create driver record
        const { error: driverError } = await supabase.from("drivers").insert({
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: "driver",
          status: "active",
        });

        if (driverError) {
          console.error("Driver creation error:", driverError);
          // Note: Auth user is created, but driver record failed
          // This should be handled by the admin
        }

        toast.success("Account created successfully! Please verify your email.");
        router.push("/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo & Branding */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-3 relative">
          <Image
            src="/lslogo.png"
            alt="Lelani School Logo"
            width={80}
            height={80}
            className="rounded-full"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-white">Lelani School</h1>
        <p className="text-primary-100 text-sm">Transport Management System</p>
      </div>

      {/* Register Form */}
      <div className="bg-surface rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john@lelani.school"
              autoComplete="email"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+254712345678"
              className="form-input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: +254XXXXXXXXX
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              autoComplete="new-password"
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
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300"
          >
            Login
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="text-center mt-6 text-primary-100 text-sm">
        &copy; 2026 Lelani School. All rights reserved.
      </p>
    </div>
  );
}
