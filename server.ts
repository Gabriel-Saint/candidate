import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/students", async (req, res) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/students", async (req, res) => {
    try {
      const { name, email, phone, status, plan } = req.body;
      console.log("Attempting to insert student:", { name, email, phone, status, plan });
      
      const { data, error } = await supabase
        .from("students")
        .insert([{ name, email, phone, status: status || 'Ativo', plan }])
        .select();
      
      if (error) {
        console.error("Supabase insert error:", error);
        return res.status(500).json({ error: error.message });
      }
      
      console.log("Insert successful:", data);
      res.status(201).json(data ? data[0] : null);
    } catch (err: any) {
      console.error("Server error during post:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  });

  app.patch("/api/students/:id", async (req, res) => {
    try {
      const { name, email, phone, status, plan } = req.body;
      const { data, error } = await supabase
        .from("students")
        .update({ name, email, phone, status, plan })
        .eq("id", req.params.id)
        .select()
        .single();
      
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Schedule Routes
  app.get("/api/schedules", async (req, res) => {
    const { data, error } = await supabase
      .from("schedules")
      .select(`
        *,
        student:students(name)
      `)
      .order("scheduled_at", { ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const { student_id, scheduled_at, duration_minutes, notes } = req.body;
      const { data, error } = await supabase
        .from("schedules")
        .insert([{ student_id, scheduled_at, duration_minutes, notes }])
        .select()
        .single();
      
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Financial Routes
  app.get("/api/transactions", async (req, res) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("due_date", { ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const { description, amount, type, category, due_date, status } = req.body;
      const { data, error } = await supabase
        .from("transactions")
        .insert([{ description, amount, type, category, due_date, status: status || 'Pendente' }])
        .select()
        .single();
      
      if (error) return res.status(500).json({ error: error.message });
      res.status(201).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const { data, error } = await supabase
        .from("transactions")
        .update({ status })
        .eq("id", req.params.id)
        .select()
        .single();
      
      if (error) return res.status(500).json({ error: error.message });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VOLL Candidate running on http://localhost:${PORT}`);
  });

  return app;
}

export default startServer();
