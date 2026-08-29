import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CarFront, Pencil, Trash2 } from "lucide-react";
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
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
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
    onError: (error) => {
      toast.error(`Unable to add team member: ${error.message}`);
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      if (!editingMember) {
        throw new Error("No team member selected");
      }
      return apiFetch<TeamMember>(
        `/api/admin/team-members/${editingMember.id}`,
        {
          method: "PUT",
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
      toast.success("Team member updated");
      setTeamModalOpen(false);
      setEditingMember(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-team"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
    onError: (error) => {
      toast.error(`Unable to update team member: ${error.message}`);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiFetch<void>(`/api/admin/team-members/${memberId}`, { method: "DELETE" }, true);
    },
    onSuccess: async () => {
      toast.success("Team member deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-team"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
      ]);
    },
    onError: (error) => {
      toast.error(`Unable to delete team member: ${error.message}`);
    },
  });

  const resetTeamForm = () => {
    setTeamForm({ name: "", role: "mechanic", phone_number: "", is_active: true });
  };

  const closeTeamModal = () => {
    setTeamModalOpen(false);
    setEditingMember(null);
    resetTeamForm();
  };

  const openAddTeamModal = () => {
    setEditingMember(null);
    resetTeamForm();
    setTeamModalOpen(true);
  };

  const openEditTeamModal = (member: TeamMember) => {
    setEditingMember(member);
    setTeamForm({
      name: member.name,
      role: member.role,
      phone_number: member.phone_number ?? "",
      is_active: member.is_active,
    });
    setTeamModalOpen(true);
  };

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
          onClick={openAddTeamModal}
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
            headers={["Name", "Role", "Phone", "Active", "Joined", "Actions"]}
            rows={team.map((member) => [
              member.name,
              member.role,
              member.phone_number ?? "-",
              member.is_active ? "Yes" : "No",
              new Date(member.created_at).toLocaleDateString(),
              <div key={`actions-${member.id}`} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditTeamModal(member)}
                  aria-label={`Edit ${member.name}`}
                  title={`Edit ${member.name}`}
                  className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete ${member.name}? Team members with assigned orders cannot be deleted.`)) {
                      deleteTeamMutation.mutate(member.id);
                    }
                  }}
                  aria-label={`Delete ${member.name}`}
                  title={`Delete ${member.name}`}
                  disabled={deleteTeamMutation.isPending}
                  className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>,
            ])}
            emptyMessage="No team members yet."
          />
        </Panel>
      </div>

      {teamModalOpen && (
        <Modal title={editingMember ? `Edit staff member #${editingMember.id}` : "Add staff member"} onClose={closeTeamModal}>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (editingMember) {
                updateTeamMutation.mutate();
              } else {
                teamMutation.mutate();
              }
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
                onClick={closeTeamModal}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={teamMutation.isPending || updateTeamMutation.isPending}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {teamMutation.isPending || updateTeamMutation.isPending
                  ? "Saving..."
                  : editingMember
                    ? "Save changes"
                    : "Add staff"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
