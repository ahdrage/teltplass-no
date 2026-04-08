import { NextRequest, NextResponse } from "next/server";

import { createBackblazeUploadTarget } from "@/lib/backblaze.server";

interface UploadImageRequestBody {
  contentType?: string;
  fileName?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as UploadImageRequestBody;
  const fileName = body.fileName?.trim();

  if (!fileName) {
    return NextResponse.json(
      { error: "fileName is required" },
      { status: 400 },
    );
  }

  try {
    const uploadTarget = await createBackblazeUploadTarget({
      contentType: body.contentType,
      entityId: crypto.randomUUID(),
      fileName,
      folder: "submissions",
    });

    return NextResponse.json(uploadTarget);
  } catch (error) {
    console.error("Failed to create Backblaze upload target", error);
    return NextResponse.json(
      { error: "Failed to create upload target" },
      { status: 500 },
    );
  }
}
