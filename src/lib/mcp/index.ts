import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProgress from "./tools/get-progress";
import listMissionHistory from "./tools/list-mission-history";
import completeMission from "./tools/complete-mission";
import updateProfile from "./tools/update-profile";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "soulsync",
  title: "SoulSync",
  version: "0.1.0",
  instructions:
    "Tools for SoulSync, a mental-wellbeing RPG. Read the signed-in player's progress and mission history, record completed wellbeing missions (awarding XP, coins, gems and stat changes), and update their profile name, avatar or archetype.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProgress, listMissionHistory, completeMission, updateProfile],
});
