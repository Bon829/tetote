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
            actionText: "サインイン / 登録",
        },
    },
    signUp: {
        ...jaJP.signUp,
        start: {
            ...jaJP.signUp?.start,
            title: "",
            actionText: "アカウントを作成",
        },
    },
};

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider localization={localization}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
