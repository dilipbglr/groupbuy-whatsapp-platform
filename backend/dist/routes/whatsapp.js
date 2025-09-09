"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const whatsappController_1 = require("../controllers/whatsappController");
const router = express_1.default.Router();
router.post('/webhook', express_1.default.urlencoded({ extended: false }), whatsappController_1.handleWebhook);
exports.default = router;
//# sourceMappingURL=whatsapp.js.map