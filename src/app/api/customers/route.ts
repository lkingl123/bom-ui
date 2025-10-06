import { NextResponse } from "next/server";

const BASE_URL = process.env.INFLOW_BASE_URL!;
const COMPANY_ID = process.env.INFLOW_COMPANY_ID!;
const API_KEY = process.env.INFLOW_API_KEY!;

type CustomerAPIResponse = {
  customerId: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
};

export async function GET(req: Request) {
  console.log("🚀 [GET /api/customers] Request received");

  // Log basic environment configuration (only partial keys for safety)
  console.log("🔧 ENV CONFIG:", {
    BASE_URL: BASE_URL ? BASE_URL.slice(0, 20) + "..." : "undefined",
    COMPANY_ID,
    API_KEY: API_KEY ? API_KEY.slice(0, 8) + "... (hidden)" : "undefined",
  });

  const { searchParams } = new URL(req.url);
  const smart = searchParams.get("smart");
  console.log("🔍 Query params:", { smart });

  const url = smart
    ? `${BASE_URL}/${COMPANY_ID}/customers?filter[smart]=${encodeURIComponent(smart)}`
    : `${BASE_URL}/${COMPANY_ID}/customers`;

  console.log("🌐 Constructed inFlow API URL:", url);

  try {
    console.log("📡 Sending request to inFlow API...");
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json;version=2025-06-24",
        "Content-Type": "application/json",
      },
    });

    console.log("📥 Received response from inFlow API:", res.status, res.statusText);

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("❌ inFlow API error:", res.status, errorBody);
      return NextResponse.json(
        { error: `inFlow API error ${res.status}`, details: errorBody },
        { status: res.status }
      );
    }

    console.log("✅ inFlow API responded OK, parsing JSON...");
    const data: CustomerAPIResponse[] = await res.json();
    console.log("📊 Raw API data length:", data.length);

    const customers = data.map((c, index) => {
      const mapped = {
        customerId: c.customerId,
        name: c.name,
        contactName: c.contactName ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        website: c.website ?? "",
      };
      console.log(`🧩 Mapped customer [${index}]:`, mapped);
      return mapped;
    });

    console.log("✅ All customers mapped successfully. Total:", customers.length);
    return NextResponse.json(customers);
  } catch (err: unknown) {
    console.error("💥 Unexpected error occurred:", err);

    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
