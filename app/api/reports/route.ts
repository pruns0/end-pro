import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

function localUserIdToUuid(localId: string): string {
  // Create a consistent UUID based on the local user ID
  // This ensures the same local ID always maps to the same UUID
  const hash = localId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  // Convert to positive number and create hex string
  const positiveHash = Math.abs(hash)
  const hex = positiveHash.toString(16).padStart(8, "0")

  // Create additional hex segments for a proper UUID with correct padding
  const segment1 = hex.padStart(8, "0") // 8 characters
  const segment2 = hex.slice(0, 4).padStart(4, "0") // 4 characters
  const segment3 = ("4" + hex.slice(1, 4)).padStart(4, "0") // 4 characters, Version 4 UUID
  const segment4 = ("8" + hex.slice(2, 4)).padStart(4, "0") // 4 characters, Variant bits
  const segment5 = (hex + hex + "000000").slice(0, 12) // 12 characters

  // Return properly formatted UUID: 8-4-4-4-12
  return `${segment1}-${segment2}-${segment3}-${segment4}-${segment5}`
}

export async function POST(request: NextRequest) {
  try {
    const reportData = await request.json()
    const { originalFiles, currentUser, ...reportFields } = reportData

    if (!currentUser || !currentUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (currentUser.role !== "TU" && currentUser.role !== "Admin") {
      return NextResponse.json({ error: "Only TU can create reports" }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const userUuid = localUserIdToUuid(currentUser.id)

    // Generate tracking number
    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const validStatuses = ["draft", "in-progress", "completed", "revision-required", "forwarded-to-tu"]
    const status = validStatuses.includes(reportFields.status) ? reportFields.status : "draft"

    const validPriorities = ["rendah", "sedang", "tinggi"]
    const priority = validPriorities.includes(reportFields.priority) ? reportFields.priority : "sedang"

    // Insert report into database
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        no_surat: reportFields.noSurat,
        hal: reportFields.hal,
        layanan: reportFields.layanan,
        dari: reportFields.dari,
        tanggal_surat: reportFields.tanggalSurat,
        tanggal_agenda: reportFields.tanggalAgenda,
        status: status,
        priority: priority,
        created_by: userUuid, // Use converted UUID
        current_holder: userUuid, // Use converted UUID
      })
      .select()
      .single()

    if (reportError) {
      console.error("Error creating report:", reportError)
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }

    // Insert file attachments if any
    if (originalFiles && originalFiles.length > 0) {
      const fileAttachments = originalFiles.map((file: any) => ({
        report_id: report.id,
        file_name: file.fileName,
        file_url: file.fileUrl,
        file_type: "original",
        file_size: file.size || null,
        uploaded_by: userUuid, // Use converted UUID
      }))

      const { error: filesError } = await supabase.from("file_attachments").insert(fileAttachments)

      if (filesError) {
        console.error("Error saving file attachments:", filesError)
        return NextResponse.json({ error: "Failed to save file attachments" }, { status: 500 })
      }
    }

    // Create workflow history entry
    const { error: workflowError } = await supabase.from("workflow_history").insert({
      report_id: report.id,
      action: "Laporan dibuat",
      user_id: userUuid, // Use converted UUID
      status: status,
      notes: `Laporan baru dibuat oleh ${currentUser.role}`,
    })

    if (workflowError) {
      console.error("Error creating workflow history:", workflowError)
    }

    const { data: tracking } = await supabase
      .from("letter_tracking")
      .select("tracking_number")
      .eq("report_id", report.id)
      .single()

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        trackingNumber: tracking?.tracking_number || `TRK-${report.id.slice(0, 8)}`,
      },
    })
  } catch (error) {
    console.error("Error in report creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select(`
        *,
        file_attachments (*),
        letter_tracking (*),
        profiles!reports_created_by_fkey (name, role)
      `)
      .order("created_at", { ascending: false })

    if (reportsError) {
      console.error("Error fetching reports:", reportsError)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
