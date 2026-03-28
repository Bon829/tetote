import { SignIn } from "@clerk/nextjs";
import "../../auth.css";

export default function SignInPage() {
    return (
        <div className="auth-outer">
            <div className="auth-card-wrap animate-slide-up">
                <SignIn 
                    routing="path" 
                    path="/sign-in"
                    signUpUrl="/sign-up"
                />
            </div>
        </div>
    );
}
