import { SignUp } from "@clerk/nextjs";
import "../../auth.css";

export default function SignUpPage() {
    return (
        <div className="auth-outer">
            <div className="auth-card-wrap animate-slide-up">
                <SignUp 
                    routing="path" 
                    path="/sign-up"
                    signInUrl="/sign-in"
                />
            </div>
        </div>
    );
}
