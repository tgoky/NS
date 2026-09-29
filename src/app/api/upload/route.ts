import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  // Signed-in users only: this writes to the public bucket with the service role.
  return withAuth(async () => {
    try {
      const supabase = createSupabaseAdminClient();
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }
      if (file.type && !file.type.startsWith("image/")) {
        return NextResponse.json({ success: false, error: "Only images can be uploaded" }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ success: false, error: "Image must be 10MB or smaller" }, { status: 400 });
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { data, error } = await supabase.storage.from("items").upload(filename, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

      if (error) {
        console.error("Supabase upload error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("items").getPublicUrl(data.path);

      return NextResponse.json({ success: true, data: { url: publicUrl } });
    } catch (err) {
      console.error("Upload route error:", err);
      const message = err instanceof Error ? err.message : "Upload failed";
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  });
}
