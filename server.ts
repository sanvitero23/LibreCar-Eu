import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const hostMap: Record<string, string> = {
  US: 'https://api-us.libreview.io',
  EU: 'https://api-eu.libreview.io',
  AP: 'https://api-ap.libreview.io',
  AU: 'https://api-au.libreview.io',
  CA: 'https://api-ca.libreview.io',
  DE: 'https://api-de.libreview.io',
  FR: 'https://api-fr.libreview.io',
  JP: 'https://api-jp.libreview.io'
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // LibreLinkUp API proxy - login
  app.post("/api/libre/login", async (req: express.Request, res: express.Response): Promise<any> => {
    const { email, password, region } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const baseUrl = hostMap[region as string] || "https://api-eu.libreview.io";

    try {
      const loginResponse = await fetch(`${baseUrl}/llu/auth/login`, {
        method: "POST",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "product": "llu.android",
          "version": "4.10.0"
        },
        body: JSON.stringify({ email, password })
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        return res.status(loginResponse.status).json({ error: "Failed to login to LibreLinkUp", details: errorText });
      }

      const loginData = (await loginResponse.json()) as any;
      if (loginData.status !== 0) {
        return res.status(401).json({ error: loginData.error?.message || "Invalid credentials", status: loginData.status });
      }

      const token = loginData.data?.authTicket?.token;
      if (!token) {
        return res.status(500).json({ error: "Token not found in authentication response" });
      }

      // Get connections to show which patient accounts are available
      const conResponse = await fetch(`${baseUrl}/llu/connections`, {
        method: "GET",
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "product": "llu.android",
          "version": "4.10.0",
          "authorization": `Bearer ${token}`
        }
      });

      let connections: any[] = [];
      if (conResponse.ok) {
        const conData = (await conResponse.json()) as any;
        connections = conData.data || [];
      }

      return res.json({
        token,
        baseUrl,
        connections
      });

    } catch (err: any) {
      console.error("LibreLinkUp login exception:", err);
      return res.status(500).json({ error: "Exception during login, check internet connection", details: err?.message });
    }
  });

  // LibreLinkUp API proxy - connections status & current readings
  app.get("/api/libre/connections", async (req: express.Request, res: express.Response): Promise<any> => {
    const authHeader = req.headers.authorization;
    const baseUrl = req.query.baseUrl as string;

    if (!authHeader || !baseUrl) {
      return res.status(400).json({ error: "Missing authorization header or baseUrl query" });
    }

    try {
      const response = await fetch(`${baseUrl}/llu/connections`, {
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "product": "llu.android",
          "version": "4.10.0",
          "authorization": authHeader
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch connections" });
      }

      const payload = (await response.json()) as any;
      return res.json(payload.data || []);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  // LibreLinkUp API proxy - graph & realtime glucose
  app.get("/api/libre/readings", async (req: express.Request, res: express.Response): Promise<any> => {
    const authHeader = req.headers.authorization;
    const baseUrl = req.query.baseUrl as string;
    const connectionId = req.query.connectionId as string;

    if (!authHeader || !baseUrl || !connectionId) {
      return res.status(400).json({ error: "Missing authorization, baseUrl, or connectionId" });
    }

    try {
      const response = await fetch(`${baseUrl}/llu/connections/${connectionId}/graph`, {
        headers: {
          "accept": "application/json",
          "content-type": "application/json",
          "product": "llu.android",
          "version": "4.10.0",
          "authorization": authHeader
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: "Failed to fetch graph data", details: errText });
      }

      const resData = (await response.json()) as any;
      return res.json(resData.data || {});
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  // Nightscout API proxy - readings
  app.get("/api/nightscout/readings", async (req: express.Request, res: express.Response): Promise<any> => {
    let url = req.query.url as string;
    const token = req.query.token as string;

    if (!url) {
      return res.status(400).json({ error: "Missing Nightscout URL" });
    }

    // Standardize URL protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    try {
      // Path for sgv (sensor glucose values) list
      let fetchUrl = `${url.replace(/\/$/, "")}/api/v1/entries/sgv.json?count=5`;
      
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json"
      };

      if (token) {
        // Set api-secret header or add token as query parameter
        headers["api-secret"] = token;
      }

      const response = await fetch(fetchUrl, { headers });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Nightscout server returned status ${response.status}` });
      }

      const entries = await response.json();
      return res.json(entries);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to connect to Nightscout server", details: err?.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
