// Get 2FA status
export const get2FAStatus = async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return sendError(res, "Token required", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
        const user = await User.findById(decoded.userId);

        if (!user) {
            return sendError(res, "User not found", 404);
        }

        res.status(200).json({
            isEnabled: user.twoFactorEnabled || false
        });
    } catch (err) {
        logger.error(`[ERROR] Get 2FA status error: ${(err as Error).message}`);
        sendError(res, "Failed to get 2FA status", 500);
    }
};

export default {
    enforceHttps,
    register,
    login,
    refresh,
    logout,
    sendError,
    upload,
    getTokenFromRequest,
    verifyEmail,
    updatePassword,
    forgotPassword,
    resetPassword,
    googleCallback,
    enable2FA,
    disable2FA,
    verify2FACode,
    get2FAStatus,
}; 