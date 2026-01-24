import { AccessToken } from "npm:livekit-server-sdk@^2.0.0";
import { createClientFromRequest } from "jsr:@base44/sdk@^0.8.11";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // 获取当前用户
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取请求参数
    const { roomName, userHoldingPercent = 0 } = await req.json();
    
    if (!roomName) {
      return Response.json({ error: "roomName is required" }, { status: 400 });
    }

    // 从环境变量获取 LiveKit 配置
    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");
    const wsUrl = Deno.env.get("LIVEKIT_URL");

    if (!apiKey || !apiSecret || !wsUrl) {
      return Response.json({ 
        error: "LiveKit not configured. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL in Dashboard → Settings → Secrets" 
      }, { status: 500 });
    }

    // 创建 AccessToken
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.email,
      name: user.full_name || user.email,
      metadata: JSON.stringify({
        userId: user.id,
        holdingPercent: userHoldingPercent,
      }),
    });

    // 设置权限：基于持仓决定是否可以发言
    const canPublish = userHoldingPercent >= 0.01; // 0.01% 以上可以发言
    
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: canPublish,
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return Response.json({
      token,
      wsUrl,
      canPublish,
      identity: user.email,
    });

  } catch (error) {
    console.error("getLiveKitToken error:", error);
    return Response.json({ 
      error: error.message || "Failed to generate token" 
    }, { status: 500 });
  }
});