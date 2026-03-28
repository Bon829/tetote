import { SignUp } from "@clerk/nextjs";
import "../../auth.css";

export default function SignUpPage() {
    return (
        <div className="auth-outer">
            <div className="auth-brand animate-fade-in">
                <p>lymph drainage</p>
                <h1>tetote</h1>
            </div>
            <div className="auth-card-wrap animate-slide-up delay-300">
                <SignUp 
                    routing="path" 
                    path="/sign-up" 
                    signInUrl="/sign-in"
                />
            </div>
        </div>
    );
}
