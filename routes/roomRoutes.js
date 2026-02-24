const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const crypto = require("crypto");

/**
 * ZEGOCLOUD Token04 generation — Official implementation.
 * Source: https://github.com/ZEGOCLOUD/zego_server_assistant/tree/master/token/nodejs
 *
 * Algorithm:
 *  1. Build JSON payload: { app_id, user_id, nonce, ctime, expire, payload }
 *  2. AES-256-CBC encrypt with serverSecret as key, random 16-char IV
 *  3. Pack binary: expire(8B bigint64 BE) + ivLen(2B uint16) + iv + encLen(2B uint16) + encryptedBuf
 *  4. Base64 the whole thing, prepend "04"
 */
function makeRandomIv() {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function aesEncrypt(plainText, key, iv) {
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(iv));
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    return encrypted;
}

function generateToken04(appId, userId, serverSecret, effectiveTimeInSeconds, payload = "") {
    if (!appId || typeof appId !== "number") throw new Error("appId must be a number");
    if (!userId || typeof userId !== "string") throw new Error("userId must be a string");
    if (!serverSecret || serverSecret.length !== 32) throw new Error("serverSecret must be 32 chars");

    const createTime = Math.floor(Date.now() / 1000);
    const expireTime = createTime + effectiveTimeInSeconds;
    const nonce = Math.ceil((-2147483648 + 4294967295) * Math.random()); // random int32 range

    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        nonce,
        ctime: createTime,
        expire: expireTime,
        payload: payload || "",
    };

    const plainText = JSON.stringify(tokenInfo);
    const iv = makeRandomIv(); // 16-char random IV
    const encryptedBuf = aesEncrypt(plainText, serverSecret, iv);

    // Pack binary structure (big-endian):
    //   expire     : 8 bytes (int64 big-endian)
    //   iv length  : 2 bytes (uint16)
    //   iv         : 16 bytes
    //   enc length : 2 bytes (uint16)
    //   encrypted  : N bytes
    const ivBuf = Buffer.from(iv, "utf8");
    const totalLen = 8 + 2 + ivBuf.length + 2 + encryptedBuf.length;
    const buf = Buffer.alloc(totalLen);
    let offset = 0;

    buf.writeBigInt64BE(BigInt(expireTime), offset); offset += 8;
    buf.writeUInt16BE(ivBuf.length, offset); offset += 2;
    ivBuf.copy(buf, offset); offset += ivBuf.length;
    buf.writeUInt16BE(encryptedBuf.length, offset); offset += 2;
    encryptedBuf.copy(buf, offset);

    return "04" + buf.toString("base64");
}

// ─── Shared in-memory room store ─────────────────────────────────────────────
const activeRooms = new Map();

// ─── POST /api/rooms/token ────────────────────────────────────────────────────
router.post("/token", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.plan === "free" || !user.plan) {
            return res.status(403).json({
                error: "premium_required",
                message: "Live Rooms require a Pro subscription.",
            });
        }

        const { roomId } = req.body;
        if (!roomId) return res.status(400).json({ error: "roomId is required" });

        const appId = parseInt(process.env.ZEGO_APP_ID, 10);
        const serverSecret = process.env.ZEGO_SERVER_SECRET;

        // If ZEGOCLOUD env vars aren't set yet, return a demo mode response
        if (!appId || !serverSecret) {
            return res.json({
                token: "ZEGO_NOT_CONFIGURED",
                userId: user._id.toString(),
                userName: user.name,
                roomId,
                appId: 0,
                demo: true,
            });
        }

        const userId = user._id.toString();
        const token = generateToken04(appId, userId, serverSecret, 3600);

        // Check if this user is the host of this room
        const room = activeRooms.get(roomId);
        const isHost = room ? room.hostId === userId : false;

        res.json({ token, userId, userName: user.name, roomId, appId, isHost });
    } catch (err) {
        console.error("Token generation error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/rooms/create-room ─────────────────────────────────────────────
router.post("/create-room", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.plan === "free" || !user.plan) {
            return res.status(403).json({ error: "premium_required" });
        }
        const { title, type = "audio" } = req.body;
        if (!title) return res.status(400).json({ error: "title required" });

        const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const room = {
            id: roomId,
            title,
            type,
            hostId: user._id.toString(),
            hostName: user.name,
            organization: user.organization.toString(),
            participants: 0,
            createdAt: new Date(),
            live: true,
        };
        activeRooms.set(roomId, room);

        // Auto-remove after 4 hours
        setTimeout(() => activeRooms.delete(roomId), 4 * 60 * 60 * 1000);

        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/rooms/list ──────────────────────────────────────────────────────
router.get("/list", authMiddleware, async (req, res) => {
    try {
        const orgId = req.user.organization.toString();
        const rooms = Array.from(activeRooms.values()).filter(
            (r) => r.organization === orgId && r.live
        );
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/rooms/close/:roomId ─────────────────────────────────────────
router.delete("/close/:roomId", authMiddleware, async (req, res) => {
    const { roomId } = req.params;
    const room = activeRooms.get(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.hostId !== req.user._id.toString()) {
        return res.status(403).json({ error: "Only the host can close the room" });
    }
    activeRooms.delete(roomId);
    res.json({ message: "Room closed" });
});

module.exports = router;
