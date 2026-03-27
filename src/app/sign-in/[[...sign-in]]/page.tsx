import { SignIn } from "@clerk/nextjs";
import "../../auth.css";

export default function SignInPage() {
    return (
        <div className="auth-outer">
            <div className="auth-brand animate-fade-in">
                <p>lymph drainage</p>
                <h1>tetote</h1>
            </div>
            <div className="auth-card-wrap animate-slide-up delay-300">
                <SignIn 
                    routing="path" 
                    path="/sign-in"
                    signUpUrl="/sign-in" // Keep on same page
                    appearance={{
                        elements: {
                            rootBox: "margin: 0 auto;",
                            card: "glass-panel shadow-none border-none",
                            headerTitle: {
                                display: "none" // Hide the title as requested
                            },
                            headerSubtitle: {
                                display: "none"
                            },
                            footer: {
                                display: "none"
                            },
                            formButtonPrimary: "btn-primary hover:bg-primary-light transition-all",
                            footerActionLink: "text-primary hover:text-primary-light transition-colors",
                            identityPreviewText: "text-serif",
                            formFieldLabel: "text-serif opacity-80",
                        },
                        variables: {
                            colorPrimary: "#B89B8A",
                            colorText: "#3A3028",
                            colorTextSecondary: "#5A4E44",
                            fontFamily: "var(--font-serif-jp), serif",
                        }
                    }}
                />
            </div>
        </div>
    );
}
