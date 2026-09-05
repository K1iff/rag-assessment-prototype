//edit nalang design

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. Validate that the passwords match before talking to the database
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    if (password.length < 6) {
      //edit nalang kung ano man ung requirements
      setError("Password must be at least 6 characters long.");
      return;
    }

    // 2. Update the password for the temporarily authenticated user
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      alert("Password successfully updated!");
      router.push("/login"); // Redirect back to your main login page
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-10 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Enter New Password</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg"
        >
          Save Password
        </button>
      </form>
    </div>
  );
}
