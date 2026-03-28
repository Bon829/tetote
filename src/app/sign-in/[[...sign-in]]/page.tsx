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
                    signUpUrl="/sign-up"
                />
            </div>
        </div>
    );
}
