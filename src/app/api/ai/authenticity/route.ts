import { NextRequest, NextResponse } from "next/server";

const LUXURY_BRANDS = new Set([
  "balenciaga", "margiela", "maison margiela", "off-white", "off white",
  "supreme", "yeezy", "rick owens", "stone island", "comme des garcons",
  "comme des garçons", "cdg", "gucci", "louis vuitton", "lv", "chanel",
  "prada", "bottega veneta", "celine", "givenchy", "dior", "burberry",
  "valentino", "versace", "fendi", "acne studios", "a-cold-wall",
  "palm angels", "amiri", "fear of god", "fog", "chrome hearts",
  "bape", "a bathing ape", "stussy", "palace", "kith", "vlone",
  "gallery dept", "gallery department", "helmut lang", "raf simons",
  "undercover", "issey miyake", "yohji yamamoto", "y-3", "number nine",
]);

function isBrandFlaggable(brand: string): boolean {
  if (!brand) return false;
  return LUXURY_BRANDS.has(brand.toLowerCase().trim());
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, brand, title } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: "imageUrl required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        data: { flagged: false, confidence: "low", verdict: "AI check unavailable — add OPENROUTER_API_KEY to .env", issues: [], skipped: true },
      });
    }

    if (!isBrandFlaggable(brand)) {
      return NextResponse.json({
        success: true,
        data: { flagged: false, confidence: "high", verdict: "Standard item — no authenticity check needed", issues: [], skipped: true },
      });
    }

    const prompt = `You are a fashion authentication expert specialising in luxury and streetwear items. Examine the image of a "${title}" claiming to be "${brand}".

Check these specific authenticity signals:
1. Label/tag quality — stitching, font consistency, hologram, country of origin
2. Hardware — weight, finish quality, logo engravings
3. Material texture — stitching density, fabric grain, leather pebbling
4. Logo placement — symmetry, spacing, proportions
5. Overall construction — seam alignment, lining quality

Respond ONLY with a JSON object (no markdown, no code blocks), exactly:
{
  "flagged": boolean,
  "confidence": "high" | "medium" | "low",
  "verdict": "one sentence summary under 120 chars",
  "issues": ["array of specific concern strings, empty if none"]
}

If the image quality is too low to assess, set confidence to "low" and flagged to false.
If it clearly looks authentic, set flagged to false.
If there are suspicious signals, set flagged to true and list specific issues.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://stuffsdrop.com",
        "X-Title": "StuffsDrop",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_VISION_MODEL ?? "anthropic/claude-haiku-4.5",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      throw new Error(`OpenRouter ${response.status}`);
    }

    const json = await response.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "";

    let parsed: { flagged: boolean; confidence: string; verdict: string; issues: string[] };
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match
        ? JSON.parse(match[0])
        : { flagged: false, confidence: "low", verdict: "Could not parse response", issues: [] };
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (err) {
    console.error("Authenticity check error:", err);
    return NextResponse.json({
      success: true,
      data: { flagged: false, confidence: "low", verdict: "Check failed — will retry on next upload", issues: [], skipped: true },
    });
  }
}