"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";
import "./Navbar.css";

export function Navbar() {
    const { isSignedIn } = useAuth();
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href;

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link href="/">
                    <span className="navbar-logo-label">lymph drainage</span>
                    <span className="navbar-logo-name">tetote</span>
                </Link>
            </div>
            <ul className="navbar-links">
                <li className={isActive("/") ? "active" : ""}>
                    <Link href="/">HOME</Link>
                </li>
                <li className={isActive("/booking") ? "active" : ""}>
                    <Link href="/booking">RESERVE</Link>
                </li>
                {isSignedIn && (
                    <li className={isActive("/mypage") ? "active" : ""}>
                        <Link href="/mypage">MY PAGE</Link>
                    </li>
                )}
                <li className="navbar-auth">
                    {isSignedIn ? (
                        <SignOutButton>
                            <button className="btn-outline">SIGN OUT</button>
                        </SignOutButton>
                    ) : (
                        <SignInButton mode="modal">
                            <button className="btn-outline">SIGN IN</button>
                        </SignInButton>
                    )}
                </li>
            </ul>
        </nav>
    );
}
