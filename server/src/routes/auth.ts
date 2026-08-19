import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import axios from 'axios';
import { protect } from '../middleware/authMiddleware'; // Import the protect middleware(This was the missing part of the code that was causing the error of bluring the ai pitch after payment upgrade. It was not imported in the auth.ts file, so the /me route was not protected and was returning a 401 error. I added the import statement for the protect middleware and used it in the /me route to fix the issue.)

const router = express.Router(); 

router.post('/google', async (req, res) => {
    try {  
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // Fetch user profile from Google using Bearer Authorization header
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const { email, name, sub } = googleRes.data;

        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            user = new User({ 
                username: name, 
                email: email.toLowerCase(), 
                googleId: sub 
            });
            await user.save();
        }

        const secret = process.env.JWT_SECRET || 'fallback_secret_key';
        const ourToken = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });

        return res.json({ token: ourToken, user });
    } catch (error: any) {
        console.error("Google Auth Route Error:", error?.response?.data || error.message);
        return res.status(500).json({ message: "Google Auth Failed", error: error.message });
    }
});

// Get latest user info (The "Me" route)
// Get latest user info (Required for syncProfile to work)
router.get('/me', protect, async (req: any, res: any) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });

        //  AUTOMATIC DYNAMIC DOWNGRADE GUARD
        const now = new Date();
        const hasExpired = user.proExpiry && new Date(user.proExpiry) < now;

        if (hasExpired && user.isPro) {
            user.isPro = false;
            await user.save(); // Permanently saves the downgraded state in MongoDB Atlas
            console.log(`Auth Guard: Automatically downgraded expired user profile ${user._id}`);
        }

        res.json(user);
    } catch (err) {
        console.error('Auth Me Error:', err);
        res.status(500).send('Server Error');
    }
});



export default router;