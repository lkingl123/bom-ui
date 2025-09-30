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
  const { searchParams } = new URL(req.url);
  const smart = searchParams.get("smart");

  const url = smart
    ? `${BASE_URL}/${COMPANY_ID}/customers?filter[smart]=${encodeURIComponent(smart)}`
    : `${BASE_URL}/${COMPANY_ID}/customers`;

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

    const data: CustomerAPIResponse[] = await res.json();

    const customers = data.map((c) => ({
      customerId: c.customerId,
      name: c.name,
      contactName: c.contactName ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      website: c.website ?? "",
    }));

    return NextResponse.json(customers);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[customers] ❌", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
