import { MessageSquare, Phone, Mail, FileText, MessagesSquare, type LucideIcon } from "lucide-react";
import type { Channel } from "@/types";

export const CHANNEL_ICONS: Record<Channel, LucideIcon> = {
  chat: MessagesSquare,
  whatsapp: MessageSquare,
  email: Mail,
  form: FileText,
  phone: Phone,
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  chat: "Live Chat",
  whatsapp: "WhatsApp",
  email: "Email",
  form: "Form",
  phone: "Phone",
};
