// src/app/api/vendors/route.ts
import { NextResponse } from "next/server";

const BASE_URL = process.env.INFLOW_BASE_URL!;
const COMPANY_ID = process.env.INFLOW_COMPANY_ID!;
const API_KEY = process.env.INFLOW_API_KEY!;

type VendorAPIResponse = {
  vendorId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const smart = searchParams.get("smart");

  const url = smart
    ? `${BASE_URL}/${COMPANY_ID}/vendors?filter[smart]=${encodeURIComponent(
        smart
      )}`
    : `${BASE_URL}/${COMPANY_ID}/vendors`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json;version=2025-06-24",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      return NextResponse.json(
        { error: `inFlow API error ${res.status}`, details: errorBody },
        { status: res.status }
      );
    }

    const data: VendorAPIResponse[] = await res.json();

    // ✅ Normalize vendor list
    const vendors = data.map((v) => ({
      vendorId: v.vendorId,
      name: v.name,
      contactName: v.contactName ?? "",
      email: v.email ?? "",
      phone: v.phone ?? "",
      website: v.website ?? "",
    }));

    return NextResponse.json(vendors);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[vendors] ❌", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
