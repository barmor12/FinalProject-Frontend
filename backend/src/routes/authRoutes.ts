router.post("/2fa/enable", authController.enable2FA);
router.post("/2fa/disable", authController.disable2FA);
router.post("/2fa/verify", authController.verify2FACode);
router.get("/2fa/status", authController.get2FAStatus); 