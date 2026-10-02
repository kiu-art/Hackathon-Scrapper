import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

import App from "./App.jsx";
import "./index.css";

// Retrieve Clerk Publishable Key from Vite environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "[SYS_ERR] Missing Clerk Publishable Key. Set VITE_CLERK_PUBLISHABLE_KEY in your .env file."
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#f4f4f5", // zinc-100
          colorBackground: "#0c0c0e", // elevated ERP container dark
          colorInputBackground: "#09090b", // base input dark
          colorInputText: "#f4f4f5",
          colorText: "#e4e4e7",
          colorTextSecondary: "#71717a",
          borderRadius: "0.25rem",
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
        elements: {
          card: "border border-zinc-800 bg-[#0c0c0e] shadow-2xl rounded",
          headerTitle: "text-zinc-100 font-sans text-sm font-semibold",
          headerSubtitle: "text-zinc-500 font-mono text-xs",
          socialButtonsBlockButton:
            "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white font-mono text-xs transition-colors",
          formButtonPrimary:
            "bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold py-2 transition-colors",
          formFieldInput:
            "bg-zinc-950 border-zinc-800 text-zinc-200 placeholder-zinc-700 font-mono text-xs focus:border-zinc-600 rounded",
          footerActionLink: "text-blue-400 hover:text-blue-300 font-mono text-xs",
          identityPreviewText: "text-zinc-300 font-mono text-xs",
          formFieldLabel: "text-zinc-400 font-mono text-[11px]",
          dividerLine: "bg-zinc-800",
          dividerText: "text-zinc-600 font-mono text-[10px]",
        },
      }}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);