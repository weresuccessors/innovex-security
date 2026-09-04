import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type Severity = "Low" | "Medium" | "High" | "Critical";

type Indicator = {
  title: string;
  detail: string;
  points: number;
};

function getSeverity(riskScore: number): Severity {
  if (riskScore >= 80) return "Critical";
  if (riskScore >= 60) return "High";
  if (riskScore >= 30) return "Medium";
  return "Low";
}

function getRecommendation(severity: Severity): string {
  switch (severity) {
    case "Critical":
      return "Do not click links, reply, share sensitive information, or make payments. Block the sender and report the message.";
    case "High":
      return "Treat this message as suspicious. Do not follow its instructions or share OTPs, PINs, passwords, or financial information.";
    case "Medium":
      return "Proceed with caution. Verify the sender and any request through an official channel before taking action.";
    default:
      return "No strong suspicious indicators were detected. Continue to verify unexpected messages before taking action.";
  }
}

function analyzeSms(sender: string, message: string) {
  const indicators: Indicator[] = [];
  const lowerSender = sender.toLowerCase();
  const lowerMessage = message.toLowerCase();
  const combined = `${lowerSender} ${lowerMessage}`;

  const addIndicator = (
    title: string,
    detail: string,
    points: number,
  ) => {
    indicators.push({
      title,
      detail,
      points,
    });
  };

  // 1. Suspicious sender patterns
  const senderLooksGeneric =
    /^(bank|alert|security|support|service|admin|verify|update|customer|help)[-_ ]?(alert|notice|team|service)?$/i.test(
      sender.trim(),
    );

  const senderLooksLikePhone =
    /^\+?\d[\d\s().-]{6,}$/.test(sender.trim());

  if (senderLooksGeneric) {
    addIndicator(
      "Generic sender identity",
      "The sender uses a generic alert, support, security, or service-style identity instead of a clearly identifiable organization.",
      12,
    );
  }

  if (senderLooksLikePhone) {
    addIndicator(
      "Phone-number sender",
      "The message appears to originate from a phone number rather than a clearly identifiable organization sender ID.",
      5,
    );
  }

  // 2. Impersonation / brand language
  const impersonationPatterns = [
    /\bbank\b/i,
    /\bsbi\b/i,
    /\bhdfc\b/i,
    /\bicici\b/i,
    /\baxis\b/i,
    /\byes bank\b/i,
    /\bpaytm\b/i,
    /\bphonepe\b/i,
    /\bgpay\b/i,
    /\bpaypal\b/i,
    /\bamazon\b/i,
    /\bapple\b/i,
    /\bgoogle\b/i,
    /\bmicrosoft\b/i,
    /\bincome tax\b/i,
    /\bincometax\b/i,
    /\bgovernment\b/i,
    /\bpolice\b/i,
    /\bcourier\b/i,
    /\bdelivery\b/i,
  ];

  const impersonationMatch = impersonationPatterns.find((pattern) =>
    pattern.test(combined),
  );

  if (impersonationMatch) {
    addIndicator(
      "Possible impersonation",
      "The message references a recognizable organization, financial service, platform, government body, or delivery service and may be attempting to appear official.",
      14,
    );
  }

  // 3. Urgency and pressure
  const urgencyPatterns = [
    /\burgent\b/i,
    /\bimmediately\b/i,
    /\bact now\b/i,
    /\bwithin\s+\d+\s*(minute|minutes|hour|hours|day|days)\b/i,
    /\btoday\b/i,
    /\bfinal warning\b/i,
    /\blast warning\b/i,
    /\bexpires?\b/i,
    /\bdeadline\b/i,
    /\bas soon as possible\b/i,
    /\baccount\s+(will be\s+)?(blocked|suspended|closed|deactivated)\b/i,
  ];

  if (urgencyPatterns.some((pattern) => pattern.test(message))) {
    addIndicator(
      "Urgency or pressure",
      "The message creates time pressure or threatens account consequences to encourage immediate action.",
      15,
    );
  }

  // 4. Sensitive information requests
  const sensitivePatterns = [
    /\botp\b/i,
    /\bone[- ]time password\b/i,
    /\bpassword\b/i,
    /\bpin\b/i,
    /\bcvv\b/i,
    /\bcard number\b/i,
    /\bdebit card\b/i,
    /\bcredit card\b/i,
    /\bbank account\b/i,
    /\baccount number\b/i,
    /\bupi\b/i,
    /\blogin credentials?\b/i,
    /\bsecurity code\b/i,
    /\bverification code\b/i,
    /\bpersonal information\b/i,
  ];

  if (sensitivePatterns.some((pattern) => pattern.test(message))) {
    addIndicator(
      "Sensitive information request",
      "The message asks for or references credentials, OTPs, PINs, card details, banking information, or other sensitive information.",
      22,
    );
  }

  // 5. Suspicious action requests
  const actionPatterns = [
    /\bclick\b/i,
    /\btap\b/i,
    /\bopen\b/i,
    /\bverify\b/i,
    /\bconfirm\b/i,
    /\blog ?in\b/i,
    /\bsign ?in\b/i,
    /\bupdate\b/i,
    /\bactivate\b/i,
    /\bdownload\b/i,
    /\breply\b/i,
    /\bcall\b/i,
    /\bvisit\b/i,
  ];

  if (actionPatterns.some((pattern) => pattern.test(message))) {
    addIndicator(
      "Action requested",
      "The message asks the recipient to perform an action such as clicking, verifying, logging in, updating information, downloading, calling, or replying.",
      10,
    );
  }

  // 6. URL detection
  const urlMatches = message.match(
    /https?:\/\/[^\s<>"']+/gi,
  );

  if (urlMatches && urlMatches.length > 0) {
    addIndicator(
      "Link detected",
      `The message contains ${urlMatches.length} web link${urlMatches.length > 1 ? "s" : ""}. Links in unexpected messages should be verified before opening.`,
      10,
    );

    const suspiciousUrlPatterns = [
      /@/i,
      /xn--/i,
      /bit\.ly/i,
      /tinyurl/i,
      /t\.co/i,
      /goo\.gl/i,
      /is\.gd/i,
      /cutt\.ly/i,
      /shorturl/i,
      /\d{1,3}(?:\.\d{1,3}){3}/i,
    ];

    if (
      urlMatches.some((url) =>
        suspiciousUrlPatterns.some((pattern) => pattern.test(url)),
      )
    ) {
      addIndicator(
        "Suspicious link pattern",
        "At least one detected link contains a pattern commonly associated with shortened, obfuscated, or unusual URLs.",
        16,
      );
    }
  }

  // 7. Financial / reward scam language
  const financialScamPatterns = [
    /\breward\b/i,
    /\bprize\b/i,
    /\blottery\b/i,
    /\bjackpot\b/i,
    /\bcashback\b/i,
    /\brefund\b/i,
    /\bfree\s+(gift|money|cash)\b/i,
    /\bbonus\b/i,
    /\bwon\b/i,
    /\bwinning\b/i,
    /\bclaim\b/i,
    /\bk[yY][cC]\b/i,
  ];

  if (
    financialScamPatterns.some((pattern) => pattern.test(message))
  ) {
    addIndicator(
      "Potential financial scam language",
      "The message contains reward, refund, prize, cashback, KYC, or money-related language commonly seen in scam messages.",
      13,
    );
  }

  // 8. Consequence / threat language
  const consequencePatterns = [
    /\bblocked\b/i,
    /\bsuspended\b/i,
    /\bclosed\b/i,
    /\bdeactivated\b/i,
    /\blegal action\b/i,
    /\bpolice action\b/i,
    /\bpenalty\b/i,
    /\bfine\b/i,
    /\bblacklisted\b/i,
    /\baccount\s+termination\b/i,
  ];

  if (
    consequencePatterns.some((pattern) => pattern.test(message))
  ) {
    addIndicator(
      "Threat or consequence language",
      "The message warns of blocking, suspension, penalties, legal action, or other negative consequences.",
      10,
    );
  }

  // 9. Executable / malicious download references
  const downloadPatterns = [
    /\.(apk|exe|dmg|zip)\b/i,
    /\binstall\b/i,
    /\bdownload\s+(this|the|an)?\s*(app|file|apk|software)\b/i,
  ];

  if (downloadPatterns.some((pattern) => pattern.test(message))) {
    addIndicator(
      "Suspicious download instruction",
      "The message appears to encourage downloading or installing software or a file.",
      18,
    );
  }

  // Calculate score
  const rawScore = indicators.reduce(
    (total, indicator) => total + indicator.points,
    0,
  );

  const riskScore = Math.min(100, rawScore);
  const severity = getSeverity(riskScore);
  const threatDetected = riskScore >= 60;

  // Confidence reflects observable signal coverage,
  // not a machine-learning probability.
  const indicatorCount = indicators.length;

  let confidence = 35;

  if (indicatorCount >= 1) confidence = 55;
  if (indicatorCount >= 2) confidence = 65;
  if (indicatorCount >= 3) confidence = 75;
  if (indicatorCount >= 4) confidence = 85;
  if (indicatorCount >= 5) confidence = 92;

  if (riskScore < 30 && indicatorCount === 0) {
    confidence = 70;
  }

  const explanation =
    indicators.length > 0
      ? `The analysis detected ${indicators.length} observable suspicious signal${
          indicators.length > 1 ? "s" : ""
        } in the SMS. The calculated risk is ${riskScore}/100 based on sender, language, requested actions, links, and other measurable patterns.`
      : "No strong suspicious indicators were detected in this message using the current SMS heuristic checks.";

  return {
    riskScore,
    severity,
    threatDetected,
    confidence,
    indicators,
    explanation,
    recommendation: getRecommendation(severity),
  };
}

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

    const body = await request.json();

    const sender =
      typeof body?.sender === "string"
        ? body.sender.trim()
        : "";

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!sender) {
      return NextResponse.json(
        {
          success: false,
          error: "Sender is required.",
        },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "SMS message is required.",
        },
        { status: 400 },
      );
    }

    if (sender.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Sender is too long.",
        },
        { status: 400 },
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: "SMS message is too long.",
        },
        { status: 400 },
      );
    }

    const analysis = analyzeSms(sender, message);

    const { data: insertedScan, error: insertError } =
      await supabase
        .from("security_scans")
        .insert({
          user_id: userId,
          scan_type: "sms",
          input_value: `Sender: ${sender}\nMessage: ${message}`,
          normalized_url: null,
          domain: null,
          protocol: null,
          risk_score: analysis.riskScore,
          severity: analysis.severity,
          confidence: analysis.confidence,
          threat_detected: analysis.threatDetected,
          indicators: analysis.indicators,
          recommendation: analysis.recommendation,
          analysis_type: "SMS heuristic analysis",
          threat_intelligence_checked: false,
          threat_intelligence_message:
            "External threat-intelligence lookup is not connected yet.",
        })
        .select("id, created_at")
        .single();

    if (insertError) {
      console.error("SMS scan database error:", insertError);

      return NextResponse.json(
        {
          success: false,
          error: "The SMS was analyzed, but the scan could not be saved.",
          details: insertError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      scanId: insertedScan.id,
      createdAt: insertedScan.created_at,
      analysis,
    });
  } catch (error) {
    console.error("SMS scan API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to analyze the SMS right now.",
      },
      { status: 500 },
    );
  }
}