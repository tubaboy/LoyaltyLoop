
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interface for LINE Flex Message
interface LineFlexMessage {
    type: string;
    altText: string;
    contents: any;
}

const PORT = Deno.env.get("PORT") ? parseInt(Deno.env.get("PORT")!) : 8000;

console.log(`Starting service on port ${PORT}...`);

serve(async (req) => {
    // Health check endpoint for Zeabur
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") {
        return new Response("OK", { status: 200 });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        console.log("Received report request...");

        // 1. Initialize Supabase Admin Client
        // On Zeabur, these will be set in the Service's Variable settings
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Configuration & Time Calculation (Target: Taiwan Time GMT+8)
        const MERCHANT_ID = Deno.env.get('TARGET_MERCHANT_ID');
        const LINE_CHANNEL_TOKEN = Deno.env.get('LINE_CHANNEL_TOKEN');
        const LINE_USER_ID = Deno.env.get('LINE_USER_ID');

        if (!MERCHANT_ID || !LINE_CHANNEL_TOKEN || !LINE_USER_ID) {
            throw new Error("Missing environment variables: TARGET_MERCHANT_ID, LINE_CHANNEL_TOKEN, or LINE_USER_ID");
        }

        // Get current time in GMT+8
        const nowCtx = new Date();
        const taiwanOffset = 8 * 60;
        const localTime = new Date(nowCtx.getTime() + (taiwanOffset * 60 * 1000));

        // Construct Start of Day (00:00:00) and End of Day (23:59:59) in Taiwan Time
        // Then convert back to ISO strings (UTC) for database query
        const startOfDayTaiwan = new Date(localTime);
        startOfDayTaiwan.setUTCHours(0, 0, 0, 0);
        const queryStart = new Date(startOfDayTaiwan.getTime() - (taiwanOffset * 60 * 1000)).toISOString();

        const endOfDayTaiwan = new Date(localTime);
        endOfDayTaiwan.setUTCHours(23, 59, 59, 999);
        const queryEnd = new Date(endOfDayTaiwan.getTime() - (taiwanOffset * 60 * 1000)).toISOString();

        const displayDate = `${localTime.getUTCFullYear()}/${String(localTime.getUTCMonth() + 1).padStart(2, '0')}/${String(localTime.getUTCDate()).padStart(2, '0')}`;

        console.log(`Generating report for: ${displayDate} (Query: ${queryStart} to ${queryEnd})`);

        // 3. Data Fetching
        const [transRes, customersRes] = await Promise.all([
            supabase
                .from('transactions')
                .select('amount, type')
                .eq('merchant_id', MERCHANT_ID)
                .gte('created_at', queryStart)
                .lte('created_at', queryEnd),
            supabase
                .from('customers')
                .select('id', { count: 'exact', head: true })
                .eq('merchant_id', MERCHANT_ID)
                .gte('created_at', queryStart)
                .lte('created_at', queryEnd)
        ]);

        if (transRes.error) throw transRes.error;
        if (customersRes.error) throw customersRes.error;

        const transactions = transRes.data || [];
        const newMembersCount = customersRes.count || 0;

        // 4. Calculate Stats
        const issuedPoints = transactions
            .filter(t => t.type === 'add')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const redeemedTrans = transactions.filter(t => ['redeem', 'manual_redeem'].includes(t.type));
        const redeemedPoints = redeemedTrans.reduce((sum, t) => sum + (t.amount || 0), 0);
        const redemptionCount = redeemedTrans.length;

        // 5. Construct LINE Flex Message
        const flexMessage: LineFlexMessage = {
            type: "flex",
            altText: `📊 ${displayDate} 營運日報`,
            contents: {
                type: "bubble",
                size: "giga",
                hero: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        { type: "text", text: "LoyaltyLoop", weight: "bold", color: "#1aa34a", size: "sm" },
                        { type: "text", text: "本日營運概況", weight: "bold", size: "xxl", margin: "md" },
                        { type: "text", text: displayDate, size: "xs", color: "#aaaaaa", wrap: true }
                    ],
                    paddingAll: "20px",
                    paddingBottom: "0px"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        // Row 1: Issued & Redeemed Points
                        {
                            type: "box",
                            layout: "horizontal",
                            contents: [
                                {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                        { type: "text", text: "發放點數", size: "xs", color: "#aaaaaa" },
                                        { type: "text", text: issuedPoints.toLocaleString(), size: "xl", weight: "bold", color: "#333333" }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                        { type: "text", text: "回收點數", size: "xs", color: "#aaaaaa" },
                                        { type: "text", text: redeemedPoints.toLocaleString(), size: "xl", weight: "bold", color: "#ef4444" }
                                    ]
                                }
                            ],
                            margin: "lg"
                        },
                        { type: "separator", margin: "xl" },
                        // Row 2: Redemption Count & New Members
                        {
                            type: "box",
                            layout: "horizontal",
                            contents: [
                                {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                        { type: "text", text: "兌換次數", size: "xs", color: "#aaaaaa" },
                                        { type: "text", text: `${redemptionCount} 次`, size: "lg", weight: "bold", color: "#333333" }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "vertical",
                                    contents: [
                                        { type: "text", text: "新增會員", size: "xs", color: "#aaaaaa" },
                                        { type: "text", text: `+${newMembersCount} 人`, size: "lg", weight: "bold", color: "#3b82f6" }
                                    ]
                                }
                            ],
                            margin: "xl"
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "button",
                            style: "link",
                            height: "sm",
                            action: { type: "uri", label: "查看詳細報表", uri: "https://loyaltyloop.zeabur.app/dashboard" }
                        },
                        { type: "text", text: "LoyaltyLoop 自動生成", size: "xxs", color: "#aaaaaa", align: "center" }
                    ],
                    paddingAll: "20px"
                }
            }
        };

        const payload = {
            to: LINE_USER_ID,
            messages: [flexMessage]
        };

        // 6. Send to LINE
        const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!lineRes.ok) {
            const errText = await lineRes.text();
            console.error(`LINE API Error: ${lineRes.status} ${errText}`);
            return new Response(`LINE API Error: ${errText}`, { status: 500 });
        }

        console.log("Report sent successfully.");
        return new Response(
            JSON.stringify({ success: true, date: displayDate }),
            { headers: { "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error("Error processing request:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}, { port: PORT });
