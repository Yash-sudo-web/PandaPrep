import {UserModel} from '../models/user.model.js';



export const usersignup = async (req, res) => {
    try {
        const { uid, email, displayName, photoURL, providerId,createdAt, lastLoginAt ,providerData ,tokens} = req.body;
        
        const user = await UserModel.findOneAndUpdate(
            { email },
            { uid, displayName, photoURL, providerId, createdAt, lastLoginAt ,providerData,tokens},
            { new: true, upsert: true }
        );

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}