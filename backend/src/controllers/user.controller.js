import { UserModel } from '../models/user.model.js';
import { verifyFirebaseToken } from '../middlewares/auth-verify.middleware.js'; 

export const userSignupController = async (req, res) => {
  try {
    const {
      uid,
      email,
      displayName,
      photoURL,
      providerId,
      createdAt,
      lastLoginAt,
      providerData,
      tokens,
    } = req.body;

    const user = await UserModel.findOneAndUpdate(
      { email },
      { uid, displayName, photoURL, providerId, createdAt, lastLoginAt, providerData, tokens },
      { new: true, upsert: true }
    );

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserController = async (req, res) => {
  try {
    const email = req.user.email; 

    const user = await UserModel.findOne({ email });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

      res.json(user);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
  }
}

