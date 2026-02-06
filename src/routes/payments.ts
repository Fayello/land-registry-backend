import { Router } from "express";
import { PaymentController } from "../controllers/PaymentController";

const router = Router();

router.post("/initiate", PaymentController.initiate);
router.post("/confirm", PaymentController.confirm);

export default router;
