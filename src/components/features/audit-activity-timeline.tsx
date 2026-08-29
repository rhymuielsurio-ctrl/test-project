import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import { StatusBadge } from "@/components/features/status-badge";
import { MOCK_LEAVE_TYPES } from "@/lib/mock-data";

export interface AuditEntry {
  id: string;
  leave_request_id: string;
  actor_id: string;
  action: string;
  details: string | null;
  occurred_at: string;
}

export interface AuditRequest {
  id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  auditEntries: AuditEntry[];
}

interface AuditActivityTimelineProps {
  requests: AuditRequest[];
  userName?: string;
  userNames: Record<string, string>;
}

interface ActivityItem {
  key: string;
  color: "success" | "error" | "warning" | "grey";
  title: string;
  meta: string;
  occurredAt: number;
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function resolveUserName(userId: string, userNames: Record<string, string>): string {
  return userNames[userId] ?? "Unknown";
}

function resolveLeaveTypeName(typeId: string): string {
  return MOCK_LEAVE_TYPES.find((lt) => lt.id === typeId)?.name ?? "Unknown";
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function humanizeAction(action: string): string {
  switch (action) {
    case "submitted":
      return "Request submitted";
    case "approved":
      return "Request approved";
    case "rejected":
      return "Request rejected";
    default:
      return action;
  }
}

function actionDotColor(action: string): ActivityItem["color"] {
  switch (action) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "submitted":
      return "warning";
    default:
      return "grey";
  }
}

function buildRequestActivityItems(
  request: AuditRequest,
  userNames: Record<string, string>,
): ActivityItem[] {
  const items: ActivityItem[] = request.auditEntries.map((entry) => ({
    key: entry.id,
    color: actionDotColor(entry.action),
    title:
      entry.action === "rejected" && entry.details
        ? `Rejected — ${entry.details}`
        : humanizeAction(entry.action),
    meta: [resolveUserName(entry.actor_id, userNames), formatTimestamp(entry.occurred_at)]
      .filter(Boolean)
      .join(" · "),
    occurredAt: new Date(entry.occurred_at).getTime(),
  }));

  if (
    request.decided_by &&
    request.decided_at &&
    !request.auditEntries.some((a) => a.action === request.status)
  ) {
    const rejectionDetails = request.auditEntries.find((a) => a.action === "rejected")?.details;
    items.push({
      key: `decision-${request.id}`,
      color: actionDotColor(request.status),
      title:
        request.status === "rejected" && rejectionDetails
          ? `Rejected — ${rejectionDetails}`
          : humanizeAction(request.status),
      meta: `Decided by ${resolveUserName(request.decided_by, userNames)} · ${formatTimestamp(
        request.decided_at,
      )}`,
      occurredAt: new Date(request.decided_at).getTime(),
    });
  }

  return items.sort((a, b) => a.occurredAt - b.occurredAt);
}

function sortByNewestFirst(requests: AuditRequest[]): AuditRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function AuditActivityTimeline({
  requests,
  userName,
  userNames,
}: AuditActivityTimelineProps) {
  if (requests.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
        <Typography color="text.secondary">No audit records found for this employee.</Typography>
      </Paper>
    );
  }

  const sorted = sortByNewestFirst(requests);

  return (
    <div className="flex flex-col gap-4">
      {sorted.map((request) => {
        const items = buildRequestActivityItems(request, userNames);
        return (
          <Paper key={request.id} variant="outlined" sx={{ p: 2.5 }}>
            <Stack
              component="div"
              sx={{
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: "8px",
              }}
            >
              <Box
                component="div"
                sx={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}
              >
                <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
                  {initialOf(userName ?? "?")}
                </Avatar>
                <Typography variant="subtitle2">{userName ?? "Unknown"}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {resolveLeaveTypeName(request.leave_type_id)}
                </Typography>
                <StatusBadge status={request.status} />
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {request.start_date} — {request.end_date}
              </Typography>
            </Stack>

            <Timeline position="right">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                  <TimelineItem key={item.key}>
                    <TimelineSeparator>
                      <TimelineDot color={item.color} />
                      {!isLast && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle2">{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.meta}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          </Paper>
        );
      })}
    </div>
  );
}
