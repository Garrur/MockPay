"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    
    try {
      // 1. Call our own merchant backend to initiate the payment
      const response = await axios.post("/api/checkout", {
        amount: 2500, // $25.00
        currency: "USD",
      });

      const { payment_url } = response.data;

      // 2. Redirect the user to the SandboxPay hosted checkout page
      if (payment_url) {
        window.location.href = payment_url;
      } else {
        setError("No payment URL returned from server.");
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred during checkout checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 font-sans text-gray-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100 text-center">
        
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
            📦
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-extrabold tracking-tight">Premium Widget subscription</h1>
        <p className="mb-8 text-gray-500 text-sm">
          Complete your purchase to get full access to our premium developer widgets.
        </p>

        <div className="mb-8 flex items-end justify-center gap-1">
          <span className="text-4xl font-extrabold">$25</span>
          <span className="text-gray-500 font-medium mb-1">.00</span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-4 py-4 text-sm text-white font-bold tracking-wide shadow-md transition-all hover:bg-blue-700 hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "Pay with SandboxPay"}
        </button>
        
        <p className="mt-6 text-xs text-gray-400">
          Powered by Developer Payment Simulation
        </p>
      </div>
    </main>
  );
}
