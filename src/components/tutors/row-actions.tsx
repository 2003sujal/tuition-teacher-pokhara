"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  RefreshCcw,
  Phone,
  MessageCircle,
  Download,
  Archive,
  ArchiveRestore,
  Trash2,
} from "lucide-react";
import { telLink, whatsappLink } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteTutorDialog, EditTutorDialog, StatusDialog, updateStatus, type DialogTutor } from "./tutor-dialogs";

export function RowActions({ tutor }: { tutor: DialogTutor }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "edit" | "status" | "delete">(null);
  const archived = tutor.status === "Archived";

  async function toggleArchive() {
    try {
      const next = archived ? "Available" : "Archived";
      await updateStatus(tutor.id, next, archived ? "Restored from archive" : "");
      toast.success(archived ? `${tutor.fullName} restored` : `${tutor.fullName} archived`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${tutor.fullName}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="truncate">{tutor.fullName}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/admin/tutors/${tutor.id}`}>
              <Eye /> View profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <Pencil /> Edit information
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDialog("status")}>
            <RefreshCcw /> Change status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={telLink(tutor.normalizedMobileNumber)}>
              <Phone /> Call tutor
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={whatsappLink(tutor.normalizedMobileNumber)} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> WhatsApp
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/api/tutors/${tutor.id}/cv?download=1`}>
              <Download /> Download CV
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={toggleArchive}>
            {archived ? <ArchiveRestore /> : <Archive />} {archived ? "Restore" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => setDialog("delete")}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTutorDialog tutor={tutor} open={dialog === "edit"} onOpenChange={(o) => setDialog(o ? "edit" : null)} />
      <StatusDialog tutor={tutor} open={dialog === "status"} onOpenChange={(o) => setDialog(o ? "status" : null)} />
      <DeleteTutorDialog tutor={tutor} open={dialog === "delete"} onOpenChange={(o) => setDialog(o ? "delete" : null)} />
    </>
  );
}
