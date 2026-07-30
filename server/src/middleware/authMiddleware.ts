import jwt from 'jsonwebtoken';

export const protect = (req: any, res: any, next: any) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid." });
    }
};