"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmployeeManagementRow } from "@/lib/leave-store";

const NO_MANAGER = "__none__";

export interface EmployeeManagerTableProps {
  employees: EmployeeManagementRow[];
}

export function EmployeeManagerTable({ employees }: EmployeeManagerTableProps) {
  const [rows, setRows] = useState(employees);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const managers = rows
    .filter((e) => e.role === "manager")
    .sort((a, b) => a.name.localeCompare(b.name));

  async function handleManagerChange(employeeId: string, managerId: string) {
    const nextManagerId = managerId === NO_MANAGER ? null : managerId;
    const previous = rows.find((e) => e.id === employeeId);
    if (previous?.manager_id === nextManagerId) return;

    setUpdatingId(employeeId);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: nextManagerId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Failed to update manager");
      }

      setRows((current) =>
        current.map((e) =>
          e.id === employeeId
            ? {
                ...e,
                manager_id: nextManagerId,
                manager_name: managers.find((m) => m.id === nextManagerId)?.name ?? null,
              }
            : e,
        ),
      );
      toast.success(`Manager updated for ${previous?.name ?? "employee"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update manager");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handlePromote(employeeId: string) {
    const previous = rows.find((e) => e.id === employeeId);
    setUpdatingId(employeeId);
    try {
      const res = await fetch(`/api/employees/${employeeId}/promote`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Failed to promote employee");
      }

      setRows((current): EmployeeManagementRow[] =>
        current.map((e) => (e.id === employeeId ? { ...e, role: "manager" as const } : e)),
      );
      toast.success(`${previous?.name ?? "Employee"} promoted to manager`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to promote employee");
    } finally {
      setUpdatingId(null);
    }
  }

  const employeeRows = rows.filter((e) => e.role === "employee");

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableCaption>Assign or reassign each employee&apos;s reporting manager.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead className="w-full">Email</TableHead>
            <TableHead>Current manager</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-56">Manager</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employeeRows.map((employee) => {
            const value = employee.manager_id ?? NO_MANAGER;
            return (
              <TableRow key={employee.id}>
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {employee.manager_name ?? "None"}
                </TableCell>
                <TableCell>
                  {employee.role === "manager" ? (
                    <span className="text-sm text-muted-foreground">Manager</span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePromote(employee.id)}
                      disabled={updatingId === employee.id}
                      aria-label={`Promote ${employee.name} to manager`}
                    >
                      {updatingId === employee.id ? "Promoting..." : "Promote"}
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={value}
                    onValueChange={(next) => handleManagerChange(employee.id, next)}
                    disabled={updatingId === employee.id}
                  >
                    <SelectTrigger className="w-56" aria-label={`Manager for ${employee.name}`}>
                      <SelectValue placeholder="Assign manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_MANAGER}>No manager</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
