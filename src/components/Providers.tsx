"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { jaJP } from "@clerk/localizations";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

// Override localization for unified auth flow
// We use a safer approach to avoid lint errors with version-specific keys
const localization = {
    ...jaJP,
    signIn: {
        ...jaJP.signIn,
        start: {
            ...jaJP.signIn?.start,
            title: "",
            subtitle: "",
            actionText: "サインイン / 登録",
        },
    },
    signUp: {
        ...jaJP.signUp,
        start: {
            ...jaJP.signUp?.start,
            title: "",
            subtitle: "",
            actionText: "アカウントを作成",
        },
    },
};

const appearance = {
    variables: {
        colorPrimary: "#B89B8A",
        colorBackground: "#FAF9F7",
        colorText: "#3A3028",
        colorTextSecondary: "#9E9088",
        fontFamily: "var(--font-sans), sans-serif",
        borderRadius: "4px",
    },
    elements: {
        card: {
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(16px)",
        },
        headerTitle: {
            fontFamily: "var(--font-serif), serif",
            color: "#3A3028",
            letterSpacing: "0.1em",
            fontSize: "1.5rem",
        },
        headerSubtitle: {
            color: "#9E9088",
        },
        formButtonPrimary: {
            fontFamily: "var(--font-serif), serif",
            fontSize: "1rem",
            letterSpacing: "0.1em",
            backgroundColor: "#B89B8A",
            color: "#fff",
            boxShadow: "0 10px 30px -10px rgba(182, 162, 142, 0.5)",
            transition: "all 0.3s ease",
            "&:hover": {
                backgroundColor: "#D4C4B7",
            }
        },
        formFieldLabel: {
            fontFamily: "var(--font-serif), serif",
            color: "#5A4E44",
        },
        socialButtonsBlockButton: {
            fontFamily: "var(--font-sans), sans-serif",
            border: "1px solid rgba(182, 162, 142, 0.3)",
            "&:hover": {
                backgroundColor: "rgba(182, 162, 142, 0.05)",
            }
        },
        footerActionLink: {
            color: "#B89B8A",
            "&:hover": {
                color: "#D4C4B7",
            }
        }
    }
};

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider localization={localization} appearance={appearance}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
