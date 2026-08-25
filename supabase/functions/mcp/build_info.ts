// Immutable build marker. `scripts/deploy-mcp.sh` overwrites BUILD_SHA with the
// exact origin/main short SHA being deployed, right before `supabase functions
// deploy`, and then polls the live `initialize` until serverInfo.build matches
// that SHA — proving the NEW artifact is live (not an old healthy response during
// edge propagation) and that a concurrent deploy didn't ship a different SHA
// (external review #3/#4). The committed value stays 'dev'; the deploy-time value
// is written into an ephemeral worktree and never committed back.
export const BUILD_SHA = 'dev'
