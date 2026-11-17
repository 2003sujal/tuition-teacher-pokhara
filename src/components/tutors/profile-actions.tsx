"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, MessageCircle, Download, Pencil, RefreshCcw, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { DeleteTutorDialog, EditTutorDialog, StatusDialog, updateStatus, type DialogTutor } from "./tutor-dialogs";

export function ProfileActions({ tutor }: { tutor: DialogTutor }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "edit" | "status" | "delete">(null);
  const [archiving, setArchiving] = useState(false);
  const archived = tutor.status === "Archived";

  async function toggleArchive() {
    setArchiving(true);
    try {
      await updateStatus(tutor.id, archived ? "Available" : "Archived", archived ? "Restored from archive" : "");
      toast.success(archived ? "Tutor restored" : "Tutor archived");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setArchiving(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={telLink(tutor.normalizedMobileNumber)}>
            <Phone aria-hidden /> Call tutor
          </a>
        </Button>
        <Button asChild className="bg-[#1a8d4f] hover:bg-[#157341]">
          <a href={whatsappLink(tutor.normalizedMobileNumber)} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden /> WhatsApp
          </a>
        </Button>
        <Button asChild variant="secondary">
          <a href={`/api/tutors/${tutor.id}/cv?download=1`}>
            <Download aria-hidden /> Download CV
          </a>
        </Button>
        <Button variant="secondary" onClick={() => setDialog("status")}>
          <RefreshCcw aria-hidden /> Change status
        </Button>
        <Button variant="secondary" onClick={() => setDialog("edit")}>
          <Pencil aria-hidden /> Edit
        </Button>
        <Button variant="secondary" onClick={toggleArchive} loading={archiving}>
          {!archiving && (archived ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />)}
          {archived ? "Restore" : "Archive"}
        </Button>
        <Button variant="destructive-ghost" onClick={() => setDialog("delete")}>
          <Trash2 aria-hidden /> Delete
        </Button>
      </div>

      <EditTutorDialog tutor={tutor} open={dialog === "edit"} onOpenChange={(o) => setDialog(o ? "edit" : null)} />
      <StatusDialog tutor={tutor} open={dialog === "status"} onOpenChange={(o) => setDialog(o ? "status" : null)} />
      <DeleteTutorDialog
        tutor={tutor}
        open={dialog === "delete"}
        onOpenChange={(o) => setDialog(o ? "delete" : null)}
        redirectTo="/admin/tutors"
      />
    </>
  );
}
