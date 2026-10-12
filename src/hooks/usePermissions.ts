import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_ROLE_PERMISSIONS, FeaturePermissions, UserRole } from "@/lib/permissions";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const usePermissions = () => {
  const { appUser } = useAuth();

  // Normalize legacy roles ("admin" -> "Master", "user" -> "Core")
  const role: UserRole = (appUser?.role === "admin" 
    ? "Master" 
    : appUser?.role === "user" 
    ? "Core" 
    : (appUser?.role || "Core")) as UserRole;

  const [permissions, setPermissions] = useState<FeaturePermissions>(() => {
    try {
      const stored = localStorage.getItem("prism_role_permissions");
      if (stored) {
        const matrix = JSON.parse(stored);
        if (matrix[role]) return matrix[role];
      }
    } catch {}
    return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.Core;
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from("pharaoh_data")
          .select("payload")
          .eq("id", "role_permissions")
          .maybeSingle();

        if (!error && data?.payload) {
          localStorage.setItem("prism_role_permissions", JSON.stringify(data.payload));
          if (isMounted && data.payload[role]) {
            setPermissions(data.payload[role]);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load permissions matrix from Supabase", e);
      }

      if (isMounted) {
        const stored = localStorage.getItem("prism_role_permissions");
        if (stored) {
          try {
            const matrix = JSON.parse(stored);
            if (matrix[role]) {
              setPermissions(matrix[role]);
              return;
            }
          } catch {}
        }
        setPermissions(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.Core);
      }
    };

    fetchPermissions();

    return () => {
      isMounted = false;
    };
  }, [role]);

  return {
    role,
    permissions,
    isMaster: role === "Master",
    isAmbassador: role === "Ambassador",
    isChampion: role === "Champion",
    isCore: role === "Core",
    hasFeature: (feature: keyof FeaturePermissions) => permissions[feature] === true,
    allocatedClients: appUser?.allocatedClients || []
  };
};
