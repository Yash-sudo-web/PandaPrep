import express from 'express';
import { userSignupController, getUserController } from '../controllers/user.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth-verify.middleware.js';


const router = express.Router();

router.post('/signin', userSignupController);

router.get('/get', verifyFirebaseToken, getUserController); 

export default router;
