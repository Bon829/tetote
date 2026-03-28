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
        borderRadius: "8px",
    },
    elements: {
        card: {
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            background: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(20px)",
            padding: "2.5rem 2rem",
        },
        headerTitle: {
            fontFamily: "var(--font-serif), serif",
            color: "#3A3028",
            letterSpacing: "0.15em",
            fontSize: "1.6rem",
            fontWeight: "400",
        },
        headerSubtitle: {
            color: "#9E9088",
            fontSize: "0.95rem",
        },
        formButtonPrimary: {
            fontFamily: "var(--font-serif), serif",
            fontSize: "1rem",
            letterSpacing: "0.15em",
            backgroundColor: "#B89B8A",
            textTransform: "uppercase",
            height: "3.2rem",
            boxShadow: "0 10px 25px -5px rgba(184, 155, 138, 0.4)",
            transition: "all 0.3s ease",
            "&:hover": {
                backgroundColor: "#A68A79",
                transform: "translateY(-1px)",
            }
        },
        formFieldInput: {
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            border: "1px solid rgba(182, 162, 142, 0.2)",
            "&:focus": {
                border: "1px solid #B89B8A",
                boxShadow: "0 0 0 2px rgba(184, 155, 138, 0.1)",
            }
        },
        socialButtonsBlockButton: {
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            border: "1px solid rgba(182, 162, 142, 0.2)",
            "&:hover": {
                backgroundColor: "rgba(182, 162, 142, 0.05)",
            }
        },
        footerActionLink: {
            color: "#B89B8A",
            fontWeight: "600",
            "&:hover": {
                color: "#A68A79",
            }
        },
        identityPreview: {
            backgroundColor: "rgba(182, 162, 142, 0.05)",
            border: "1px solid rgba(182, 162, 142, 0.1)",
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
