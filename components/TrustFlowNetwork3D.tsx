'use client';

import React, { useEffect, useState } from 'react';

type SceneComponent = React.ComponentType;

function TrustFlowFallback() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#0B1C2D] via-[#0F2438] to-[#0B1C2D]" />
  );
}

export default function TrustFlowNetwork3D() {
  const [Scene, setScene] = useState<SceneComponent | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const reactInternals = (React as {
      __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: { ReactCurrentOwner?: unknown };
    }).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (!reactInternals?.ReactCurrentOwner) {
      setHasError(true);
      return;
    }

    let isMounted = true;

    import('@/components/TrustFlowNetwork3DScene')
      .then((mod) => {
        if (isMounted) {
          setScene(() => mod.default);
        }
      })
      .catch((error) => {
        console.error('Failed to load TrustFlowNetwork3D scene:', error);
        if (isMounted) {
          setHasError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (hasError || !Scene) {
    return <TrustFlowFallback />;
  }

  return <Scene />;
}
