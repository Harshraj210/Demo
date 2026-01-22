"use client";

import { useEffect, useState } from "react";

/**
 * A wrapper component that only renders its children on the client.
 * This prevents hydration mismatches for components that depend on 
 * browser-only APIs or state.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return null;
    }

    return <>{children}</>;
}
