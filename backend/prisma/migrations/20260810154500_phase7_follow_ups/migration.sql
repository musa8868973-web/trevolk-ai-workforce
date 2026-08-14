-- Phase 7 — AI Follow-up Employee persistence (`FollowUp` model).

CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "ai_employee_id" TEXT,
    "lead_id" TEXT,
    "customer_id" TEXT,
    "conversation_id" TEXT,
    "appointment_id" TEXT,
    "trigger_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduled_at" DATETIME,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_sent" TEXT,
    "opted_out" BOOLEAN NOT NULL DEFAULT false,
    "stop_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "follow_ups_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "follow_ups_workspace_id_status_idx" ON "follow_ups"("workspace_id", "status");
CREATE INDEX "follow_ups_workspace_id_scheduled_at_idx" ON "follow_ups"("workspace_id", "scheduled_at");
CREATE INDEX "follow_ups_lead_id_idx" ON "follow_ups"("lead_id");
CREATE INDEX "follow_ups_customer_id_idx" ON "follow_ups"("customer_id");
