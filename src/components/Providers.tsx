"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { jaJP } from "@clerk/localizations";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder-url.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

// Override localization for unified auth flow fallback
const localization = {
    ...jaJP,
    signIn: {
        ...jaJP.signIn,
        start: {
            ...jaJP.signIn?.start,
            title: "ログイン・新規登録",
            subtitle: "ご利用のメールアドレスでログインできます",
        },
    },
    signUp: {
        ...jaJP.signUp,
        start: {
            ...jaJP.signUp?.start,
            title: "アカウントを作成",
            subtitle: "情報を入力してご登録ください",
        },
    },
    unstable__errors: {
        ...jaJP.unstable__errors,
        form_identifier_not_found: 'アカウントが見つかりません。下部リンクの『アカウントを持たない場合』から新規登録へお進みください。',
    }
};

const appearance = {
    variables: {
        colorPrimary: "#B89B8A",
        colorBackground: "#181a1b",
        colorText: "#e8e6e3",
        colorTextSecondary: "#a0a0a0",
        colorInputBackground: "#242526",
        colorInputText: "#e8e6e3",
        fontFamily: "var(--font-sans), sans-serif",
        borderRadius: "8px",
    },
    elements: {
        card: {
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            background: "rgba(24, 26, 27, 0.8)",
            backdropFilter: "blur(20px)",
            padding: "2.5rem 2rem",
        },
        headerTitle: {
            fontFamily: "var(--font-serif), serif",
            color: "#e8e6e3",
        },
        headerSubtitle: {
            color: "#a0a0a0",
        },
        logoBox: {
            display: "none",
        },
        formButtonPrimary: {
            fontFamily: "var(--font-serif), serif",
            fontSize: "1rem",
            letterSpacing: "0.15em",
            backgroundColor: "#B89B8A",
            color: "#fff",
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
            backgroundColor: "rgba(36, 37, 38, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#e8e6e3",
            "&:focus": {
                border: "1px solid #B89B8A",
                boxShadow: "0 0 0 2px rgba(184, 155, 138, 0.2)",
            }
        },
        socialButtonsBlockButton: {
            backgroundColor: "rgba(36, 37, 38, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#e8e6e3",
            "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.05)",
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
            backgroundColor: "rgba(36, 37, 38, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "#e8e6e3"
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
