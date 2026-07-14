import React, { useEffect, useRef } from 'react';
import '@/lib/pharaoh/legacyPharaoh.css';

interface LegacyViewWrapperProps {
  legacy: any;
  viewFn: string;
  args?: any[];
}

export function LegacyViewWrapper({ legacy, viewFn, args = [] }: LegacyViewWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!legacy || !containerRef.current) return;
    
    const origGet = document.getElementById;
    document.getElementById = (id) => {
      if (id === 'main') return containerRef.current as HTMLElement;
      return origGet.call(document, id);
    };

    try {
      if (typeof legacy[viewFn] === 'function') {
        legacy[viewFn](...args);
      } else {
        console.warn(`Legacy function ${viewFn} not found on window object.`);
      }
    } catch (error) {
      console.error(`Error executing legacy function ${viewFn}:`, error);
    } finally {
      document.getElementById = origGet;
    }

    const observer = new MutationObserver(() => {
      if (!containerRef.current) return;
      const kpis = containerRef.current.querySelectorAll('.kpi');
      kpis.forEach(k => {
        if (!k.hasAttribute('title')) {
          k.setAttribute('title', 'Data syncs from Pharaoh Data sheet (changes here not permitted)');
        }
      });
    });
    observer.observe(containerRef.current, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [legacy, viewFn, args]);

  return <div className="legacy-pharaoh"><div ref={containerRef} id="main" className="main" style={{ minHeight: 'calc(100vh - 64px)' }} /></div>;
}
