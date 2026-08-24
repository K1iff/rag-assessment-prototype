"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    async function run() {
      // Change "profiles" to a table you actually created in your DB
      const { data, error } = await supabase.from("admin").select("*").limit(5);
      if (error) console.error(error);
      else setRows(data ?? []);
    }
    run();
  }, []);

  return (
    <div>
      <h1>Test</h1>
      <pre>{JSON.stringify(rows, null, 2)}</pre>
    </div>
  );
}
