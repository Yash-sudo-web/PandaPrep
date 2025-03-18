import express from 'express';
import { usersignup } from '../controllers/user.controller.js';


const router = express.Router();

router.post('/signin', usersignup);

export default router;
