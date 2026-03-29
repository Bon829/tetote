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
            title: "サインイン",
            subtitle: "メールアドレスを入力してください",
            actionText: "アカウントをお持ちでない方は",
            actionLink: "アカウント登録はこちら",
        },
    },
    signUp: {
        ...jaJP.signUp,
        start: {
            ...jaJP.signUp?.start,
            title: "アカウント作成",
            subtitle: "必要事項を入力してください",
            actionText: "既にアカウントをお持ちの方は",
            actionLink: "ログインはこちら",
        },
    },
    unstable__errors: {
        ...jaJP.unstable__errors,
        form_identifier_not_found: 'アカウントが見つかりません。アカウント登録へお進みください。',
        form_identifier_exists: 'アカウントが既に登録されています。ログインへお進みください。',
    }
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
        },
        headerSubtitle: {
            color: "#9E9088",
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
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            border: "1px solid rgba(182, 162, 142, 0.2)",
            color: "#3A3028",
            "&:focus": {
                border: "1px solid #B89B8A",
                boxShadow: "0 0 0 2px rgba(184, 155, 138, 0.1)",
            }
        },
        socialButtonsBlockButton: {
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            border: "1px solid rgba(182, 162, 142, 0.2)",
            color: "#3A3028",
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
            color: "#3A3028"
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
