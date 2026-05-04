"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { isEduEmail } from "@/lib/eduValidation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isEduEmail(email)) {
      setError("Only educational email addresses (.edu) are allowed.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex bg-black text-white overflow-hidden">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slideUpFade 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out;
        }
      `}</style>

      {/* Left Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 animate-fade-in">
        <div className="w-full max-w-[380px]">
          {/* Logo */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold font-serif italic mb-3 tracking-tight">
              Bloom
            </h1>
            <p className="text-gray-400 text-base font-light">Log in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            {/* Email Input */}
            <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@university.edu"
                required
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:bg-gray-900 transition-colors duration-200"
              />
            </div>

            {/* Password Input */}
            <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:bg-gray-900 transition-colors duration-200"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-slide-up p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="animate-slide-up w-full py-3 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ animationDelay: "0.3s" }}
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center leading-relaxed animate-slide-up mb-8" style={{ animationDelay: "0.5s" }}>
            Your university email is only used as a gateway. It is completely decoupled from your anonymous posts.
          </p>

          {/* Sign Up Link */}
          <p className="text-sm text-gray-400 text-center animate-slide-up" style={{ animationDelay: "0.6s" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-white font-semibold hover:underline transition-all">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Section - Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-gray-900 via-black to-gray-950 items-center justify-center p-16 animate-slide-in-right relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-32 w-96 h-96 bg-gray-800/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-gray-800/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center animate-fade-in">
          <div className="mb-8">
            <div className="text-7xl mb-6">🌸</div>
            <h2 className="text-4xl font-bold font-serif italic mb-4">Welcome Back</h2>
            <p className="text-xl text-gray-400 font-light max-w-xs mx-auto leading-relaxed">
              Share your story with the bloom community, completely anonymously.
            </p>
          </div>
          <div className="mt-12 space-y-3 text-sm text-gray-500">
            <p>✓ 100% Anonymous</p>
            <p>✓ Campus Only</p>
            <p>✓ Safe & Secure</p>
          </div>
        </div>
      </div>
    </main>
  );
}
