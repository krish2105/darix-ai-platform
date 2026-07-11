import { Users, Crown, Clock } from 'lucide-react';
import { InviteTeammateForm } from './InviteTeammateForm';

export interface TeamMember {
  userId: string;
  email: string;
  role: 'owner' | 'member';
}

interface TeamPanelProps {
  members: TeamMember[];
  pendingInvites: string[];
  isOwner: boolean;
}

// Renders the caller's team roster and, if they're the owner, pending
// invites and the invite form. Only shown at all when the signed-in user
// already belongs to an organization — there's no "create a team" button
// here, since sharing a report with "my team" (SharingPanel) is what
// lazily creates one (src/lib/organizations/ensure.ts).
export const TeamPanel = ({ members, pendingInvites, isOwner }: TeamPanelProps) => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-cyber-cyan" />
        <h2 className="font-display font-bold text-sm text-foreground">Your Team</h2>
      </div>

      <ul className="flex flex-col gap-2 mb-4">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center justify-between text-sm">
            <span className="text-foreground truncate">{member.email}</span>
            {member.role === 'owner' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-dubai-gold flex-shrink-0">
                <Crown className="w-3 h-3" /> Owner
              </span>
            )}
          </li>
        ))}
      </ul>

      {isOwner && pendingInvites.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {pendingInvites.map((email) => (
            <li key={email} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{email}</span>
              <span className="text-[10px] uppercase tracking-wider flex-shrink-0">Pending</span>
            </li>
          ))}
        </ul>
      )}

      {isOwner && <InviteTeammateForm />}
    </div>
  );
};
