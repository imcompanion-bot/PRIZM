import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_ROLE_PERMISSIONS, FeaturePermissions, UserRole } from "@/lib/permissions";
import { useEffect, useState } from "react";

export const usePermissions = () => {
  const { appUser } = useAuth();
  const [permissions, setPermissions] = useState<FeaturePermissions>(DEFAULT_ROLE_PERMISSIONS.Core);

  // Normalize legacy roles ("admin" -> "Master", "user" -> "Core")
  const role: UserRole = (appUser?.role === "admin" 
    ? "Master" 
    : appUser?.role === "user" 
    ? "Core" 
    : (appUser?.role || "Core")) as UserRole;

  useEffect(() => {
    const stored = localStorage.getItem("prism_role_permissions");
    if (stored) {
      try {
        const matrix = JSON.parse(stored);
        if (matrix[role]) {
          setPermissions(matrix[role]);
          return;
        }
      } catch (e) {
        console.error("Failed to parse custom permissions matrix", e);
      }
    }
    setPermissions(DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.Core);
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
