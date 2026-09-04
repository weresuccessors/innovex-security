import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const input =
      typeof body === "object" &&
      body !== null &&
      "input" in body &&
      typeof (body as { input?: unknown }).input === "string"
        ? (body as { input: string }).input.trim()
        : "";

    if (!input) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a URL.",
        },
        { status: 400 },
      );
    }

    if (input.length > 2048) {
      return NextResponse.json(
        {
          success: false,
          error: "The URL is too long.",
        },
        { status: 400 },
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(input);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid URL such as https://example.com",
        },
        { status: 400 },
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only HTTP and HTTPS URLs are supported.",
        },
        { status: 400 },
      );
    }

    const authKey = process.env.URLHAUS_AUTH_KEY;

    if (!authKey) {
      console.error(
        "URLHAUS_AUTH_KEY is not configured in the server environment.",
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Threat-intelligence provider is not configured on the server.",
        },
        { status: 503 },
      );
    }

    const formData = new URLSearchParams();
    formData.set("url", input);

    const urlhausEndpoint =
      "https://urlhaus-api.abuse.ch/v1/url/";

    let response: Response;

    try {
      response = await fetch(urlhausEndpoint, {
        method: "POST",
        headers: {
          "Auth-Key": authKey,
          "Content-Type":
            "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
        cache: "no-store",
      });
    } catch (fetchError) {
      console.error(
        "URLhaus network request failed:",
        fetchError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to connect to the URLhaus threat-intelligence service.",
        },
        { status: 502 },
      );
    }

    const responseText = await response.text();

    let data: Record<string, unknown>;

    try {
      data = JSON.parse(responseText) as Record<
        string,
        unknown
      >;
    } catch (parseError) {
      console.error(
        "URLhaus returned a non-JSON response.",
        {
          status: response.status,
          contentType: response.headers.get(
            "content-type",
          ),
          responsePreview: responseText.slice(0, 500),
          parseError,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The threat-intelligence provider returned an unexpected response.",
          providerStatus: response.status,
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      console.error(
        "URLhaus returned HTTP error:",
        {
          status: response.status,
          data,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Threat-intelligence provider returned an error.",
          providerStatus: response.status,
        },
        { status: 502 },
      );
    }

    const queryStatus =
      typeof data.query_status === "string"
        ? data.query_status
        : "unknown";

    if (queryStatus === "no_results") {
      return NextResponse.json({
        success: true,
        found: false,
        provider: "URLhaus",
        message:
          "URLhaus returned no matching malware URL.",
        queryStatus,
        input,
      });
    }

    if (queryStatus !== "ok") {
      return NextResponse.json({
        success: true,
        found: false,
        provider: "URLhaus",
        message: `URLhaus returned status: ${queryStatus}.`,
        queryStatus,
        input,
      });
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.filter(
          (item): item is string =>
            typeof item === "string",
        )
      : [];

    const payloads = Array.isArray(data.payloads)
      ? data.payloads
      : [];

    return NextResponse.json({
      success: true,
      found: true,
      provider: "URLhaus",
      input,
      queryStatus,

      intelligence: {
        id:
          typeof data.id === "string" ||
          typeof data.id === "number"
            ? String(data.id)
            : null,

        reference:
          typeof data.urlhaus_reference === "string"
            ? data.urlhaus_reference
            : null,

        url:
          typeof data.url === "string"
            ? data.url
            : input,

        status:
          typeof data.url_status === "string"
            ? data.url_status
            : null,

        host:
          typeof data.host === "string"
            ? data.host
            : parsedUrl.hostname,

        dateAdded:
          typeof data.date_added === "string"
            ? data.date_added
            : null,

        lastOnline:
          typeof data.last_online === "string"
            ? data.last_online
            : null,

        threat:
          typeof data.threat === "string"
            ? data.threat
            : null,

        blacklists:
          data.blacklists ?? null,

        reporter:
          typeof data.reporter === "string"
            ? data.reporter
            : null,

        reportedToHostingProvider:
          typeof data.larted === "string"
            ? data.larted
            : null,

        takedownTimeSeconds:
          typeof data.takedown_time_seconds ===
          "number"
            ? data.takedown_time_seconds
            : null,

        tags,

        payloads,
      },
    });
  } catch (error) {
    console.error(
      "Threat intelligence route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to complete the threat-intelligence lookup.",
      },
      { status: 500 },
    );
  }
}