import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CarFront } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

import {
  AdminLoginCard,
  AdminShell,
  Banner,
  Field,
  LoginResponse,
  Modal,
  Panel,
  Table,
  TeamFormState,
  TeamMember,
  inputBase,
  teamRoles,
  useAdminSession,
} from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/team")({
  head: () => ({
    meta: [{ title: "MotorMate Team" }],
  }),
  component: AdminTeamPage,
});

function AdminTeamPage() {
  const queryClient = useQueryClient();
  const session = useAdminSession();
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState<TeamFormState>({
    name: "",
    role: "mechanic",
    phone_number: "",
    is_active: true,
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<LoginResponse>(
        "/api/admin/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ username: session.username, password: session.password }),
        },
        false,
      );
    },
    onSuccess: (response) => {
      session.login(response.access_token);
    },
  });

  const teamQuery = useQuery({
    queryKey: ["admin-team", session.token],
    queryFn: () => apiFetch<TeamMember[]>("/api/admin/team-members", {}, true),
    enabled: Boolean(session.token),
  });

  const teamMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<TeamMember>(
        "/api/admin/team-members",
        {
          method: "POST",
          body: JSON.stringify({
            name: teamForm.name,
            role: teamForm.role,
            phone_number: teamForm.phone_number || null,
            is_active: teamForm.is_active,
          }),
        },
        true,
      );
    },
    onSuccess: async () => {
      toast.success("Team member added");
      setTeamModalOpen(false);
      setTeamForm({ name: "", role: "mechanic", phone_number: "", is_active: true });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-team"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
  });

  if (!session.token) {
    return (
      <AdminLoginCard
        username={session.username}
        password={session.password}
        setUsername={session.setUsername}
        setPassword={session.setPassword}
        onSubmit={() => loginMutation.mutate()}
        pending={loginMutation.isPending}
      />
    );
  }

  const team = teamQuery.data ?? [];

  return (
    <AdminShell
      section="team"
      title="Team / Staff"
      subtitle="Mechanics and support staff management."
      logout={session.logout}
      actions={
        <button
          onClick={() => setTeamModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          <CarFront className="size-4" /> Add staff
        </button>
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-8">
        {teamQuery.isError && <Banner title="Unable to load team" message={teamQuery.error.message} />}

        <Panel title="Team / Staff" actionLabel={`${team.length} total`}>
          <Table
            headers={["Name", "Role", "Phone", "Active", "Joined"]}
            rows={team.map((member) => [
              member.name,
              member.role,
              member.phone_number ?? "-",
              member.is_active ? "Yes" : "No",
              new Date(member.created_at).toLocaleDateString(),
            ])}
            emptyMessage="No team members yet."
          />
        </Panel>
      </div>

      {teamModalOpen && (
        <Modal title="Add staff member" onClose={() => setTeamModalOpen(false)}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              teamMutation.mutate();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <input
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <Field label="Role">
                <select
                  value={teamForm.role}
                  onChange={(event) => setTeamForm((current) => ({ ...current, role: event.target.value }))}
                  className={inputBase}
                >
                  {teamRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Phone number">
                <input
                  value={teamForm.phone_number}
                  onChange={(event) => setTeamForm((current) => ({ ...current, phone_number: event.target.value }))}
                  className={inputBase}
                />
              </Field>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={teamForm.is_active}
                  onChange={(event) => setTeamForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Active staff member
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTeamModalOpen(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={teamMutation.isPending}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {teamMutation.isPending ? "Saving..." : "Add staff"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
