import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type EmailAnalysisInput = {
  sender: string;
  subject: string;
  content: string;
};

type Severity = "Low" | "Medium" | "High" | "Critical";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: claimsData,
      error: authError,
    } = await supabase.auth.getClaims();

    const userId =
      typeof claimsData?.claims?.sub === "string"
        ? claimsData.claims.sub
        : null;

    if (authError || !userId) {
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

    const emailInput = extractEmailInput(body);

    if (
      !emailInput.sender &&
      !emailInput.subject &&
      !emailInput.content
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter at least a sender, subject, or email message before analyzing.",
        },
        { status: 400 },
      );
    }

    if (emailInput.sender.length > 320) {
      return NextResponse.json(
        {
          success: false,
          error: "Sender information is too long.",
        },
        { status: 400 },
      );
    }

    if (emailInput.subject.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Email subject is too long.",
        },
        { status: 400 },
      );
    }

    if (emailInput.content.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: "Email content is too long.",
        },
        { status: 400 },
      );
    }

    const analysis = analyzeEmail(emailInput);

    const { data: scan, error: insertError } = await supabase
      .from("security_scans")
      .insert({
        user_id: userId,
        scan_type: "email",
        input_value: buildStoredInput(emailInput),
        normalized_url: null,
        domain: null,
        protocol: null,
        risk_score: analysis.riskScore,
        severity: analysis.severity,
        confidence: analysis.confidence,
        threat_detected: analysis.threatDetected,
        indicators: analysis.indicators,
        recommendation: analysis.recommendation,
        analysis_type: "Email heuristic analysis",
        threat_intelligence_checked: false,
        threat_intelligence_message:
          "External threat-intelligence lookup is not connected to Email Guard yet.",
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error(
        "Email scan database error:",
        insertError,
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The email was analyzed, but the security result could not be saved.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      createdAt: scan.created_at,

      analysisType: "Email heuristic analysis",

      riskScore: analysis.riskScore,
      severity: analysis.severity,
      confidence: analysis.confidence,
      threatDetected: analysis.threatDetected,

      indicators: analysis.indicators,

      explanation: analysis.explanation,

      recommendation: analysis.recommendation,

      threatIntelligence: {
        checked: false,
        message:
          "External threat-intelligence lookup is not connected to Email Guard yet.",
      },
    });
  } catch (error) {
    console.error(
      "Email scan route error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Something went wrong while analyzing the email.",
      },
      { status: 500 },
    );
  }
}

function extractEmailInput(
  body: unknown,
): EmailAnalysisInput {
  if (
    typeof body !== "object" ||
    body === null
  ) {
    return {
      sender: "",
      subject: "",
      content: "",
    };
  }

  const record = body as Record<string, unknown>;

  return {
    sender:
      typeof record.sender === "string"
        ? record.sender.trim()
        : "",

    subject:
      typeof record.subject === "string"
        ? record.subject.trim()
        : "",

    content:
      typeof record.content === "string"
        ? record.content.trim()
        : "",
  };
}

function buildStoredInput(
  input: EmailAnalysisInput,
) {
  return [
    input.sender
      ? `Sender: ${input.sender}`
      : "",
    input.subject
      ? `Subject: ${input.subject}`
      : "",
    input.content
      ? `Content: ${input.content}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function analyzeEmail({
  sender,
  subject,
  content,
}: EmailAnalysisInput) {
  const fullText =
    `${sender}\n${subject}\n${content}`.toLowerCase();

  let riskScore = 0;

  const indicators: string[] = [];

  if (sender) {
    const suspiciousSenderPatterns = [
      "noreply-security",
      "security-alert",
      "account-security",
      "verify-account",
      "support-alert",
      "login-alert",
    ];

    const senderLower = sender.toLowerCase();

    if (
      suspiciousSenderPatterns.some((pattern) =>
        senderLower.includes(pattern),
      )
    ) {
      riskScore += 12;

      indicators.push(
        "Sender address contains a security-related pattern.",
      );
    }

    if (
      senderLower.includes("gmail.") ||
      senderLower.includes("outlook.") ||
      senderLower.includes("yahoo.")
    ) {
      if (
        /security|support|bank|payment|account|admin|official/i.test(
          sender,
        )
      ) {
        riskScore += 10;

        indicators.push(
          "Sender uses a generic email provider while presenting as an official or security-related account.",
        );
      }
    }
  }

  const urgentSubjectPatterns = [
    "urgent",
    "immediately",
    "action required",
    "account suspended",
    "account locked",
    "final warning",
    "verify your account",
    "verify account",
    "security alert",
    "payment failed",
    "payment required",
    "unauthorized",
    "important notice",
  ];

  const matchedUrgentSubjects =
    urgentSubjectPatterns.filter((pattern) =>
      subject.toLowerCase().includes(pattern),
    );

  if (matchedUrgentSubjects.length > 0) {
    riskScore += Math.min(
      20,
      matchedUrgentSubjects.length * 7,
    );

    indicators.push(
      "Subject uses urgency, account pressure, or security-alert language.",
    );
  }

  const credentialPatterns = [
    "password",
    "passcode",
    "otp",
    "one-time password",
    "verification code",
    "cvv",
    "card number",
    "credit card",
    "debit card",
    "bank account",
    "pin",
    "login credentials",
    "confirm your identity",
  ];

  const matchedCredentialPatterns =
    credentialPatterns.filter((pattern) =>
      fullText.includes(pattern),
    );

  if (matchedCredentialPatterns.length > 0) {
    riskScore += Math.min(
      30,
      matchedCredentialPatterns.length * 8,
    );

    indicators.push(
      "Message requests or references sensitive credentials or financial information.",
    );
  }

  const actionPatterns = [
    "click here",
    "click the link",
    "click below",
    "verify now",
    "confirm now",
    "login now",
    "update now",
    "download now",
    "open the attachment",
    "enable macros",
    "reply with",
  ];

  const matchedActionPatterns =
    actionPatterns.filter((pattern) =>
      fullText.includes(pattern),
    );

  if (matchedActionPatterns.length > 0) {
    riskScore += Math.min(
      20,
      matchedActionPatterns.length * 5,
    );

    indicators.push(
      "Message asks the recipient to perform an immediate action.",
    );
  }

  const impersonationPatterns = [
    "your bank",
    "bank security",
    "account department",
    "security team",
    "customer support",
    "microsoft support",
    "google support",
    "apple support",
    "amazon support",
    "paypal support",
    "government",
    "tax department",
    "income tax",
    "police department",
  ];

  const matchedImpersonationPatterns =
    impersonationPatterns.filter((pattern) =>
      fullText.includes(pattern),
    );

  if (matchedImpersonationPatterns.length > 0) {
    riskScore += Math.min(
      18,
      matchedImpersonationPatterns.length * 6,
    );

    indicators.push(
      "Message contains language associated with organization impersonation.",
    );
  }

  const urls = content.match(
    /https?:\/\/[^\s<>"']+/gi,
  );

  if (urls && urls.length > 0) {
    riskScore += Math.min(
      15,
      urls.length * 5,
    );

    indicators.push(
      `${urls.length} link${
        urls.length === 1 ? "" : "s"
      } detected in the email content.`,
    );

    const suspiciousUrlSignals = urls.filter(
      (url) =>
        /@/.test(url) ||
        /xn--/i.test(url) ||
        /bit\.ly|tinyurl\.com|t\.co|goo\.gl/i.test(
          url,
        ),
    );

    if (suspiciousUrlSignals.length > 0) {
      riskScore += Math.min(
        20,
        suspiciousUrlSignals.length * 10,
      );

      indicators.push(
        "One or more links contain URL patterns that warrant additional investigation.",
      );
    }
  }

  const attachmentPatterns = [
    "attachment",
    "attached file",
    "invoice attached",
    "document attached",
    ".exe",
    ".scr",
    ".zip",
    ".rar",
    ".js",
    ".vbs",
  ];

  const matchedAttachmentPatterns =
    attachmentPatterns.filter((pattern) =>
      fullText.includes(pattern),
    );

  if (matchedAttachmentPatterns.length > 0) {
    riskScore += Math.min(
      15,
      matchedAttachmentPatterns.length * 5,
    );

    indicators.push(
      "Message references an attachment or potentially executable file.",
    );
  }

  const pressurePatterns = [
    "within 24 hours",
    "within 12 hours",
    "within 1 hour",
    "within one hour",
    "last chance",
    "you will lose",
    "will be deleted",
    "will be suspended",
    "failure to comply",
    "legal action",
  ];

  const matchedPressurePatterns =
    pressurePatterns.filter((pattern) =>
      fullText.includes(pattern),
    );

  if (matchedPressurePatterns.length > 0) {
    riskScore += Math.min(
      20,
      matchedPressurePatterns.length * 7,
    );

    indicators.push(
      "Message uses pressure or consequences to encourage immediate action.",
    );
  }

  riskScore = Math.max(
    0,
    Math.min(100, riskScore),
  );

  const severity: Severity =
    riskScore >= 80
      ? "Critical"
      : riskScore >= 60
        ? "High"
        : riskScore >= 30
          ? "Medium"
          : "Low";

  const threatDetected =
    riskScore >= 60;

  const confidence =
    indicators.length === 0
      ? 55
      : Math.min(
          95,
          55 + indicators.length * 7,
        );

  let explanation: string;
  let recommendation: string;

  if (severity === "Critical") {
    explanation =
      "Multiple strong security indicators were found. The email shows a combination of high-risk patterns that warrants immediate caution.";

    recommendation =
      "Do not click links, open attachments, provide credentials, or reply. Verify the sender through an independent trusted channel.";
  } else if (severity === "High") {
    explanation =
      "The email contains several suspicious indicators associated with phishing or social-engineering attempts.";

    recommendation =
      "Avoid interacting with the message until the sender and request have been independently verified.";
  } else if (severity === "Medium") {
    explanation =
      "The analysis found some indicators that deserve attention, but the available evidence is not sufficient to classify the email as clearly malicious.";

    recommendation =
      "Treat the message cautiously and verify unexpected requests before clicking links or sharing information.";
  } else {
    explanation =
      "No strong malicious indicators were detected by the current Email Guard heuristic checks.";

    recommendation =
      "The message can continue to be treated cautiously. Do not rely on this analysis alone for high-impact decisions.";
  }

  return {
    riskScore,
    severity,
    threatDetected,
    confidence,
    indicators,
    explanation,
    recommendation,
  };
}