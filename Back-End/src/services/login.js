const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const signup = async (username, password, email) => {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user in the database
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        return user;
    } catch (error) {
        throw new Error('Signup failed: ' + error.message);
    }
};

const login = async (username, password) => {
    try {
        // Find the user by username
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret', {
            expiresIn: '1h',
        });

        return { token, user };
    } catch (error) {
        throw new Error('Login failed: ' + error.message);
    }
};

module.exports = { signup, login };